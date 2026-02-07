"use client";

import { BlogCard } from "@/components/blog-card";
import type { BlogCategory, BlogPostMetadata } from "@/lib/blog-types";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

interface BlogPageClientProps {
	allPosts: BlogPostMetadata[];
	categories: BlogCategory[];
}

export function BlogPageClient({ allPosts, categories }: BlogPageClientProps) {
	const [selectedCategory, setSelectedCategory] = useState<BlogCategory | "All">(
		"All"
	);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// Filter posts by category
	const filteredPosts = useMemo(() => {
		if (selectedCategory === "All") {
			return allPosts;
		}
		return allPosts.filter((post) => post.category === selectedCategory);
	}, [allPosts, selectedCategory]);

	// Get featured posts
	const featuredPosts = allPosts.filter((post) => post.featured).slice(0, 3);

	return (
		<div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Hero Section */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-12"
				>
					<h1 className="text-5xl md:text-6xl font-bold text-amber mb-4">
						Espresso Guides & Coffee Knowledge
					</h1>
					<p className="text-cream-dark text-lg md:text-xl max-w-2xl mx-auto">
						Master your espresso game with equipment guides, brewing tips, and
						coffee science.
					</p>
				</motion.div>

				{/* Featured Posts */}
				{featuredPosts.length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
						className="mb-12"
					>
						<h2 className="text-2xl font-bold text-cream mb-6">
							Featured Articles
						</h2>
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{featuredPosts.map((post, index) => (
								<BlogCard key={post.slug} post={post} index={index} />
							))}
						</div>
					</motion.div>
				)}

				{/* Category Filter */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="mb-8"
				>
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
						{/* Categories */}
						<div className="flex flex-wrap gap-2">
							<button
								onClick={() => setSelectedCategory("All")}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									selectedCategory === "All"
										? "bg-amber text-espresso"
										: "bg-coffee-dark text-cream-dark hover:text-cream border border-coffee-medium hover:border-amber/50"
								}`}
							>
								All ({allPosts.length})
							</button>
							{categories.map((category) => {
								const count = allPosts.filter(
									(post) => post.category === category
								).length;
								return (
									<button
										key={category}
										onClick={() => setSelectedCategory(category)}
										className={`px-4 py-2 rounded-lg font-medium transition-colors ${
											selectedCategory === category
												? "bg-amber text-espresso"
												: "bg-coffee-dark text-cream-dark hover:text-cream border border-coffee-medium hover:border-amber/50"
										}`}
									>
										{category} ({count})
									</button>
								);
							})}
						</div>

						{/* View Mode Toggle */}
						<div className="flex items-center gap-2 bg-coffee-dark border border-coffee-medium rounded-lg p-1">
							<button
								onClick={() => setViewMode("grid")}
								className={`p-2 rounded transition-colors ${
									viewMode === "grid"
										? "bg-amber text-espresso"
										: "text-cream-dark hover:text-cream"
								}`}
								aria-label="Grid view"
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
									<path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
								</svg>
							</button>
							<button
								onClick={() => setViewMode("list")}
								className={`p-2 rounded transition-colors ${
									viewMode === "list"
										? "bg-amber text-espresso"
										: "text-cream-dark hover:text-cream"
								}`}
								aria-label="List view"
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
									<path d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
						</div>
					</div>
				</motion.div>

				{/* Posts Grid/List */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
				>
					{filteredPosts.length === 0 ? (
						<div className="text-center py-12">
							<div className="text-6xl mb-4">📝</div>
							<p className="text-cream-dark text-lg">
								No posts found in this category yet.
							</p>
						</div>
					) : (
						<div
							className={
								viewMode === "grid"
									? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
									: "space-y-6"
							}
						>
							{filteredPosts.map((post, index) => (
								<BlogCard key={post.slug} post={post} index={index} />
							))}
						</div>
					)}
				</motion.div>
			</div>
		</div>
	);
}
