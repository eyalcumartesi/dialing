import type { Metadata } from "next";

const baseUrl =
	process.env.NEXT_PUBLIC_BASE_URL || "https://dialing.vercel.app/";

export const metadata: Metadata = {
	title: "Equipment Profile",
	description:
		"Set up your espresso machine, grinder, and basket specifications for personalized recipe recommendations.",
	openGraph: {
		title: "Equipment Profile | Dial",
		description:
			"Configure your espresso equipment for personalized grind and dose recommendations.",
		url: `${baseUrl}/profile`,
		images: [
			{
				url: `${baseUrl}/opengraph-image.png`,
				width: 1200,
				height: 630,
				alt: "Dial - Equipment Profile Setup",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Equipment Profile | Dial",
		description:
			"Configure your espresso equipment for personalized recommendations.",
		images: [`${baseUrl}/opengraph-image.png`],
	},
	alternates: {
		canonical: `${baseUrl}/profile`,
	},
};

export default function ProfileLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
