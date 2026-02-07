"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navigation() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const links = [
		{ href: "/", label: "Calculator" },
		{ href: "/profile", label: "Profile" },
		{ href: "/blog", label: "Blog" },
	];

	const isActive = (href: string) => {
		if (href === "/") {
			return pathname === "/";
		}
		return pathname.startsWith(href);
	};

	return (
		<nav className="sticky top-0 z-50 bg-espresso/95 backdrop-blur-sm border-b border-coffee-medium">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href="/" className="flex items-center space-x-2 group">
						<motion.span
							className="text-2xl font-bold text-amber group-hover:text-amber-dark transition-colors"
							whileHover={{ scale: 1.05 }}
						>
							Dial
						</motion.span>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-1">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={`relative px-4 py-2 rounded-lg transition-colors ${
									isActive(link.href)
										? "text-amber font-semibold"
										: "text-cream-dark hover:text-cream hover:bg-coffee-dark"
								}`}
							>
								{link.label}
								{isActive(link.href) && (
									<motion.div
										layoutId="activeTab"
										className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber"
										initial={false}
										transition={{ type: "spring", stiffness: 380, damping: 30 }}
									/>
								)}
							</Link>
						))}
					</div>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="md:hidden p-2 rounded-lg text-cream-dark hover:text-cream hover:bg-coffee-dark transition-colors"
						aria-label="Toggle menu"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							{mobileMenuOpen ? (
								<path d="M6 18L18 6M6 6l12 12" />
							) : (
								<path d="M4 6h16M4 12h16M4 18h16" />
							)}
						</svg>
					</button>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="md:hidden pb-4"
					>
						<div className="flex flex-col space-y-2">
							{links.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setMobileMenuOpen(false)}
									className={`px-4 py-3 rounded-lg transition-colors ${
										isActive(link.href)
											? "bg-coffee-dark text-amber font-semibold border-l-2 border-amber"
											: "text-cream-dark hover:text-cream hover:bg-coffee-dark"
									}`}
								>
									{link.label}
								</Link>
							))}
						</div>
					</motion.div>
				)}
			</div>
		</nav>
	);
}
