"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface FAQItem {
	question: string;
	answer: string;
}

const faqs: FAQItem[] = [
	{
		question: "How does Dial calculate espresso recipes?",
		answer:
			"Dial uses a deterministic, micron-based algorithm that considers your equipment specifications (machine pressure, grinder burr type), bean characteristics (roast level, freshness, origin), and environmental conditions (temperature, humidity) to recommend precise grind settings and dose amounts. The algorithm is based on espresso extraction science, not machine learning.",
	},
	{
		question: "What equipment does Dial support?",
		answer:
			"Dial supports 20+ espresso machines (including DeLonghi, Breville, Gaggia, Rancilio) and 18+ grinders (Baratza, Eureka, Niche, Fellow). The database includes both entry-level and prosumer equipment, with detailed specifications like boiler type, pressure, burr size, and microns per step for accurate calculations.",
	},
	{
		question: "Why does weather affect my espresso recipe?",
		answer:
			"Humidity and temperature impact coffee extraction. High humidity causes coffee grounds to absorb moisture, leading to clumping and requiring slightly coarser grinds. Temperature affects extraction speed—warmer environments extract faster, potentially requiring finer grinds. Dial automatically adjusts recommendations based on your local weather.",
	},
	{
		question: "How important is bean freshness for espresso?",
		answer:
			"Extremely important. Freshly roasted beans (1-4 days old) release significant CO2, causing channeling and requiring coarser grinds. Peak espresso happens 7-21 days post-roast when degassing stabilizes. Beans older than 35 days become stale and extract poorly, requiring finer grinds. Dial accounts for this with a freshness curve built into the algorithm.",
	},
	{
		question: "What's the difference between pressurized and non-pressurized baskets?",
		answer:
			"Non-pressurized (bottomless) baskets require precise grind control—water flows based purely on puck resistance. Pressurized baskets have a false bottom that creates artificial pressure, allowing coarser grinds to work. Dial adjusts grind recommendations by ~160 microns coarser for pressurized baskets to account for this difference.",
	},
	{
		question: "Do I need to enter my location for Dial to work?",
		answer:
			"No, location and weather are optional. If you don't provide a location, Dial uses default weather values (moderate temperature and humidity). However, for the most accurate recommendations, especially if you live in very humid or dry climates, entering your location helps fine-tune grind settings.",
	},
	{
		question: "Can I use Dial for light roast or dark roast beans?",
		answer:
			"Yes! Dial adjusts for roast level. Dark roasts are more porous and extract faster, requiring coarser grinds (+80 microns in the algorithm). Light roasts are denser and need finer grinds to extract properly (-40 microns). The algorithm also considers interaction effects—for example, fresh dark roasts in hot weather compound fast extraction risk.",
	},
	{
		question: "Is my data stored anywhere?",
		answer:
			"No. All your data (equipment profile, preferences) is stored locally in your browser's localStorage. Nothing is sent to a server. The only external API calls are optional: OpenWeatherMap for weather data and GeoDB Cities for location autocomplete. The recipe calculation happens entirely in your browser.",
	},
];

export function FAQ() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const toggleFAQ = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	// Generate FAQPage structured data
	const faqStructuredData = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	};

	return (
		<div className="mt-12">
			{/* Structured Data for SEO */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
			/>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
			>
				<h2 className="text-3xl font-bold text-amber mb-6">
					Frequently Asked Questions
				</h2>

				<div className="space-y-4">
					{faqs.map((faq, index) => {
						const isOpen = openIndex === index;
						const buttonId = `faq-button-${index}`;
						const panelId = `faq-panel-${index}`;

						return (
							<div
								key={index}
								className="bg-coffee-dark border border-coffee-medium rounded-lg overflow-hidden"
							>
								<button
									id={buttonId}
									onClick={() => toggleFAQ(index)}
									aria-expanded={isOpen}
									aria-controls={panelId}
									className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-coffee-medium/30 transition-colors"
								>
									<h3 className="text-lg font-semibold text-cream pr-8">
										{faq.question}
									</h3>
									<span className="text-amber text-2xl flex-shrink-0" aria-hidden="true">
										{isOpen ? "−" : "+"}
									</span>
								</button>

								{isOpen && (
									<motion.div
										id={panelId}
										role="region"
										aria-labelledby={buttonId}
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="px-6 pb-4"
									>
										<p className="text-cream-dark leading-relaxed">
											{faq.answer}
										</p>
									</motion.div>
								)}
							</div>
						);
					})}
				</div>
			</motion.div>
		</div>
	);
}
