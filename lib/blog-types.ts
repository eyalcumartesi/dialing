// Blog-specific type definitions

export type BlogCategory =
	| "Equipment Guides"
	| "Coffee Knowledge"
	| "Brewing Guides"
	| "Troubleshooting"
	| "Comparisons";

export interface BlogPost {
	slug: string;
	title: string;
	excerpt: string;
	content: string;
	category: BlogCategory;
	tags: string[];
	image: string;
	author: string;
	publishedAt: string;
	updatedAt?: string;
	readTime: string;
	featured?: boolean;
	seo?: {
		metaTitle?: string;
		metaDescription?: string;
		keywords?: string[];
	};
}

export interface BlogPostMetadata {
	slug: string;
	title: string;
	excerpt: string;
	category: BlogCategory;
	tags: string[];
	image: string;
	author: string;
	publishedAt: string;
	readTime: string;
	featured?: boolean;
}
