import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl =
		process.env.NEXT_PUBLIC_BASE_URL || "https://dialing.vercel.app";

	// Get all blog posts
	const posts = getAllPosts();

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${baseUrl}/profile`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/blog`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
	];

	// Blog post pages
	const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
		url: `${baseUrl}/blog/${post.slug}`,
		lastModified: new Date(post.publishedAt),
		changeFrequency: "monthly" as const,
		priority: 0.7,
	}));

	return [...staticPages, ...blogPages];
}
