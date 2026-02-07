import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const baseUrl =
	process.env.NEXT_PUBLIC_BASE_URL || "https://dialing.vercel.app/";

export const metadata: Metadata = {
	metadataBase: new URL(baseUrl),
	title: {
		default: "Dial — Espresso Recipe Calculator",
		template: "%s | Dial",
	},
	description:
		"A deterministic espresso dial-in calculator that recommends grind size and dose based on your beans, equipment, and environment.",
	keywords: [
		"espresso",
		"coffee",
		"dial-in",
		"grind size",
		"recipe",
		"calculator",
		"espresso calculator",
		"coffee grind size",
		"espresso recipe",
		"dial-in tool",
		"barista tool",
		"home espresso",
	],
	authors: [{ name: "Dial" }],
	creator: "Dial",
	publisher: "Dial",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: baseUrl,
		siteName: "Dial",
		title: "Dial — Espresso Recipe Calculator",
		description:
			"Get personalized espresso recipes based on your equipment, beans, and environment. Deterministic algorithm for perfect dial-in every time.",
		images: [
			{
				url: `${baseUrl}/opengraph-image.png`,
				width: 1200,
				height: 630,
				alt: "Dial - Espresso Recipe Calculator",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Dial — Espresso Recipe Calculator",
		description:
			"Get personalized espresso recipes based on your equipment, beans, and environment.",
		images: [`${baseUrl}/opengraph-image.png`],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	alternates: {
		canonical: baseUrl,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: "Dial",
		url: baseUrl,
		description:
			"A deterministic espresso dial-in calculator that recommends grind size and dose based on your beans, equipment, and environment.",
		applicationCategory: "UtilityApplication",
		operatingSystem: "Any",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		author: {
			"@type": "Organization",
			name: "Dial",
		},
		featureList: [
			"Espresso recipe calculator",
			"Equipment-specific recommendations",
			"Weather-based adjustments",
			"20+ espresso machines supported",
			"18+ grinders supported",
			"Bean freshness tracking",
			"Roast level optimization",
		],
	};

	return (
		<html lang="en">
			<head>
				{/* Structured Data */}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
				/>
			</head>
			<body className="antialiased relative">
				{/* Google AdSense Script - loads asynchronously after page interactive */}
				{process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
					<Script
						async
						src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
						crossOrigin="anonymous"
						strategy="afterInteractive"
					/>
				)}

				<div className="relative z-10">{children}</div>
			</body>
		</html>
	);
}
