import { getPostBySlug, getRelatedPosts, getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";

interface BlogPostPageProps {
	params: Promise<{ slug: string }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
	const posts = getAllPosts();
	return posts.map((post) => ({
		slug: post.slug,
	}));
}

// Generate metadata for SEO
export async function generateMetadata({
	params,
}: BlogPostPageProps): Promise<Metadata> {
	const { slug } = await params;
	const post = getPostBySlug(slug);

	if (!post) {
		return {
			title: "Post Not Found",
		};
	}

	const baseUrl =
		process.env.NEXT_PUBLIC_BASE_URL || "https://dialing.vercel.app/";

	return {
		title: post.seo?.metaTitle || post.title,
		description: post.seo?.metaDescription || post.excerpt,
		keywords: post.seo?.keywords || post.tags,
		authors: [{ name: post.author }],
		openGraph: {
			type: "article",
			title: post.title,
			description: post.excerpt,
			url: `${baseUrl}/blog/${post.slug}`,
			publishedTime: post.publishedAt,
			modifiedTime: post.updatedAt || post.publishedAt,
			images: [
				{
					url: post.image.startsWith("http")
						? post.image
						: `${baseUrl}${post.image}`,
					width: 1200,
					height: 630,
					alt: post.title,
				},
			],
			tags: post.tags,
		},
		twitter: {
			card: "summary_large_image",
			title: post.title,
			description: post.excerpt,
			images: [
				post.image.startsWith("http") ? post.image : `${baseUrl}${post.image}`,
			],
		},
	};
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
	const { slug } = await params;
	const post = getPostBySlug(slug);

	if (!post) {
		notFound();
	}

	const relatedPosts = getRelatedPosts(slug, 3);

	// Structured data for SEO
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: post.title,
		description: post.excerpt,
		image: post.image,
		datePublished: post.publishedAt,
		dateModified: post.updatedAt || post.publishedAt,
		author: {
			"@type": "Person",
			name: post.author,
		},
		publisher: {
			"@type": "Organization",
			name: "Dial",
			logo: {
				"@type": "ImageObject",
				url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://dialing.vercel.app/"}/logo.png`,
			},
		},
		articleSection: post.category,
		keywords: post.tags.join(", "),
	};

	return (
		<>
			{/* Structured Data */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
			/>

			<article className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto">
					{/* Breadcrumb */}
					<nav className="mb-6 text-sm text-cream-dark">
						<Link href="/blog" className="hover:text-amber transition-colors">
							Blog
						</Link>
						<span className="mx-2">→</span>
						<Link
							href={`/blog?category=${encodeURIComponent(post.category)}`}
							className="hover:text-amber transition-colors"
						>
							{post.category}
						</Link>
						<span className="mx-2">→</span>
						<span className="text-cream">{post.title}</span>
					</nav>

					{/* Header */}
					<header className="mb-8">
						<div className="mb-4">
							<span className="inline-block bg-amber/20 text-amber border border-amber/30 px-4 py-1.5 rounded-full text-sm font-semibold">
								{post.category}
							</span>
						</div>

						<h1 className="text-4xl md:text-5xl font-bold text-cream mb-4">
							{post.title}
						</h1>

						<p className="text-xl text-cream-dark mb-6">{post.excerpt}</p>

						<div className="flex items-center justify-between flex-wrap gap-4 text-sm text-cream-dark border-t border-b border-coffee-medium py-4">
							<div className="flex items-center gap-4">
								<span className="font-medium text-cream">{post.author}</span>
								<time dateTime={post.publishedAt}>
									{new Date(post.publishedAt).toLocaleDateString("en-US", {
										month: "long",
										day: "numeric",
										year: "numeric",
									})}
								</time>
							</div>
							<span>{post.readTime}</span>
						</div>

						{/* Tags */}
						{post.tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-4">
								{post.tags.map((tag) => (
									<span
										key={tag}
										className="text-xs text-cream-dark bg-coffee-dark border border-coffee-medium px-3 py-1.5 rounded-full"
									>
										#{tag}
									</span>
								))}
							</div>
						)}
					</header>

					{/* Featured Image */}
					{post.image && (
						<div className="mb-12 rounded-xl overflow-hidden border border-coffee-medium">
							<img
								src={post.image}
								alt={post.title}
								className="w-full h-auto"
							/>
						</div>
					)}

					{/* Content */}
					<div
						className="prose prose-invert prose-amber max-w-none mb-12"
						dangerouslySetInnerHTML={{ __html: post.content }}
					/>

					{/* Related Posts */}
					{relatedPosts.length > 0 && (
						<div className="mt-16 pt-12 border-t border-coffee-medium">
							<h2 className="text-3xl font-bold text-cream mb-6">
								Related Articles
							</h2>
							<div className="grid gap-6 md:grid-cols-3">
								{relatedPosts.map((relatedPost) => (
									<BlogCard key={relatedPost.slug} post={relatedPost} />
								))}
							</div>
						</div>
					)}

					{/* Back to Blog */}
					<div className="mt-12 text-center">
						<Link
							href="/blog"
							className="inline-flex items-center gap-2 text-amber hover:text-amber-dark transition-colors font-medium"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							Back to all articles
						</Link>
					</div>
				</div>
			</article>
		</>
	);
}
