"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { BlogPostMetadata } from "@/lib/blog-types";

interface BlogCardProps {
	post: BlogPostMetadata;
	index?: number;
}

export function BlogCard({ post, index = 0 }: BlogCardProps) {
	const categoryColors: Record<string, string> = {
		"Equipment Guides": "bg-amber/20 text-amber border-amber/30",
		"Coffee Knowledge": "bg-copper/20 text-copper border-copper/30",
		"Brewing Guides": "bg-cream/20 text-cream-dark border-cream/30",
		Troubleshooting: "bg-red-900/20 text-red-400 border-red-900/30",
		Comparisons: "bg-blue-900/20 text-blue-400 border-blue-900/30",
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.1 }}
		>
			<Link href={`/blog/${post.slug}`}>
				<div className="group h-full bg-coffee-dark border border-coffee-medium rounded-xl overflow-hidden hover:border-amber/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber/10">
					{/* Image */}
					<div className="relative aspect-video bg-coffee-medium overflow-hidden">
						{post.image ? (
							<img
								src={post.image}
								alt={post.title}
								className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-6xl">
								☕
							</div>
						)}
						{post.featured && (
							<div className="absolute top-3 right-3 bg-amber text-espresso px-3 py-1 rounded-full text-xs font-bold">
								Featured
							</div>
						)}
					</div>

					{/* Content */}
					<div className="p-6 space-y-3">
						{/* Category & Read Time */}
						<div className="flex items-center justify-between gap-2 flex-wrap">
							<span
								className={`text-xs font-semibold px-3 py-1 rounded-full border ${
									categoryColors[post.category] || categoryColors["Brewing Guides"]
								}`}
							>
								{post.category}
							</span>
							<span className="text-xs text-cream-dark">{post.readTime}</span>
						</div>

						{/* Title */}
						<h3 className="text-xl font-bold text-cream group-hover:text-amber transition-colors line-clamp-2">
							{post.title}
						</h3>

						{/* Excerpt */}
						<p className="text-cream-dark text-sm line-clamp-3">
							{post.excerpt}
						</p>

						{/* Tags */}
						{post.tags.length > 0 && (
							<div className="flex flex-wrap gap-2 pt-2">
								{post.tags.slice(0, 3).map((tag) => (
									<span
										key={tag}
										className="text-xs text-cream-dark bg-coffee-medium px-2 py-1 rounded"
									>
										#{tag}
									</span>
								))}
							</div>
						)}

						{/* Footer */}
						<div className="flex items-center justify-between pt-3 border-t border-coffee-medium text-xs text-cream-dark">
							<span>{post.author}</span>
							<time dateTime={post.publishedAt}>
								{new Date(post.publishedAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</time>
						</div>
					</div>
				</div>
			</Link>
		</motion.div>
	);
}
