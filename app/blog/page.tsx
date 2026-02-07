import { BlogPageClient } from "@/components/blog-page-client";
import { getAllPosts, getAllCategories } from "@/lib/blog";

export default function BlogPage() {
	const allPosts = getAllPosts();
	const categories = getAllCategories();

	return <BlogPageClient allPosts={allPosts} categories={categories} />;
}
