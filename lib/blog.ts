import fs from "fs";
import path from "path";
import type { BlogPost, BlogPostMetadata, BlogCategory } from "./blog-types";

const contentDirectory = path.join(process.cwd(), "content/blog");

/**
 * Get all blog posts
 */
export function getAllPosts(): BlogPostMetadata[] {
	// Check if directory exists
	if (!fs.existsSync(contentDirectory)) {
		return [];
	}

	const fileNames = fs.readdirSync(contentDirectory);
	const posts = fileNames
		.filter((fileName) => fileName.endsWith(".json"))
		.map((fileName) => {
			const slug = fileName.replace(/\.json$/, "");
			const fullPath = path.join(contentDirectory, fileName);
			const fileContents = fs.readFileSync(fullPath, "utf8");
			const post: BlogPost = JSON.parse(fileContents);

			// Return metadata only (no content)
			const metadata: BlogPostMetadata = {
				slug: post.slug,
				title: post.title,
				excerpt: post.excerpt,
				category: post.category,
				tags: post.tags,
				image: post.image,
				author: post.author,
				publishedAt: post.publishedAt,
				readTime: post.readTime,
				featured: post.featured,
			};

			return metadata;
		});

	// Sort by date (newest first)
	return posts.sort(
		(a, b) =>
			new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
	);
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
	try {
		const fullPath = path.join(contentDirectory, `${slug}.json`);
		const fileContents = fs.readFileSync(fullPath, "utf8");
		const post: BlogPost = JSON.parse(fileContents);
		return post;
	} catch (error) {
		console.error(`Error reading post ${slug}:`, error);
		return null;
	}
}

/**
 * Get all posts in a specific category
 */
export function getPostsByCategory(
	category: BlogCategory
): BlogPostMetadata[] {
	const allPosts = getAllPosts();
	return allPosts.filter((post) => post.category === category);
}

/**
 * Get related posts based on tags and category
 */
export function getRelatedPosts(
	slug: string,
	limit: number = 3
): BlogPostMetadata[] {
	const currentPost = getPostBySlug(slug);
	if (!currentPost) return [];

	const allPosts = getAllPosts();

	// Calculate relevance score for each post
	const scoredPosts = allPosts
		.filter((post) => post.slug !== slug) // Exclude current post
		.map((post) => {
			let score = 0;

			// Same category = +3 points
			if (post.category === currentPost.category) {
				score += 3;
			}

			// Shared tags = +1 point per tag
			const sharedTags = post.tags.filter((tag) =>
				currentPost.tags.includes(tag)
			);
			score += sharedTags.length;

			return { post, score };
		});

	// Sort by score and return top N
	return scoredPosts
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((item) => item.post);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): BlogCategory[] {
	const allPosts = getAllPosts();
	const categories = Array.from(new Set(allPosts.map((post) => post.category)));
	return categories as BlogCategory[];
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
	const allPosts = getAllPosts();
	const tags = allPosts.flatMap((post) => post.tags);
	return Array.from(new Set(tags)).sort();
}

/**
 * Search posts by title, excerpt, or tags
 */
export function searchPosts(query: string): BlogPostMetadata[] {
	const allPosts = getAllPosts();
	const lowerQuery = query.toLowerCase();

	return allPosts.filter(
		(post) =>
			post.title.toLowerCase().includes(lowerQuery) ||
			post.excerpt.toLowerCase().includes(lowerQuery) ||
			post.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
	);
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(): BlogPostMetadata[] {
	const allPosts = getAllPosts();
	return allPosts.filter((post) => post.featured);
}
