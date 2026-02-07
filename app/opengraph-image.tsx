import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dial - Espresso Recipe Calculator";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#1a0f0a",
					backgroundImage:
						"radial-gradient(circle at 25px 25px, #2a1a12 2%, transparent 0%), radial-gradient(circle at 75px 75px, #2a1a12 2%, transparent 0%)",
					backgroundSize: "100px 100px",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "24px",
					}}
				>
					{/* Coffee Cup Icon */}
					<div
						style={{
							fontSize: "120px",
							lineHeight: 1,
						}}
					>
						☕
					</div>

					{/* Title */}
					<div
						style={{
							fontSize: "80px",
							fontWeight: "bold",
							color: "#d4a574",
							textAlign: "center",
							lineHeight: 1.2,
						}}
					>
						Dial
					</div>

					{/* Subtitle */}
					<div
						style={{
							fontSize: "32px",
							color: "#e5d5c5",
							textAlign: "center",
							maxWidth: "900px",
							lineHeight: 1.4,
						}}
					>
						Espresso Recipe Calculator
					</div>

					{/* Description */}
					<div
						style={{
							fontSize: "24px",
							color: "#b8a390",
							textAlign: "center",
							maxWidth: "800px",
							lineHeight: 1.5,
						}}
					>
						Get personalized dose and grind recommendations based on your
						equipment, beans, and environment
					</div>
				</div>
			</div>
		),
		{
			...size,
		},
	);
}
