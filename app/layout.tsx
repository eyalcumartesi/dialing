import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
	title: "Dial — Espresso Recipe Calculator",
	description:
		"A deterministic espresso dial-in calculator that recommends grind size and dose based on your beans, equipment, and environment.",
	keywords: [
		"espresso",
		"coffee",
		"dial-in",
		"grind size",
		"recipe",
		"calculator",
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
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
