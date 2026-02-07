"use client";

import type { AlgorithmOutput, Grinder } from "@/lib/types";
import { motion } from "framer-motion";
import { useState } from "react";

interface ResultCardProps {
	result: AlgorithmOutput;
	grinder: Grinder;
	hasPID: boolean;
}

export function ResultCard({ result, grinder, hasPID }: ResultCardProps) {
	const [showReasoning, setShowReasoning] = useState(false);
	const [copied, setCopied] = useState(false);

	const formatGrindSetting = () => {
		if (typeof result.recommendedGrindSetting === "number") {
			return `${result.recommendedGrindSetting}`;
		} else {
			return `${result.recommendedGrindSetting.min.toFixed(1)} - ${result.recommendedGrindSetting.max.toFixed(1)}`;
		}
	};

	const getConfidenceColor = () => {
		switch (result.confidence) {
			case "high":
				return "text-amber";
			case "medium":
				return "text-cream";
			case "low":
				return "text-cream-dark";
		}
	};

	const copyRecipe = async () => {
		const text = `
Dial Recipe
-----------
Dose: ${result.recommendedDoseG}g
Grind: Setting ${formatGrindSetting()} on ${grinder.brand} ${grinder.model}
Yield: ${result.expectedYieldG.toFixed(1)}g
Time: ${result.expectedBrewTimeSec.min}-${result.expectedBrewTimeSec.max}s (estimated)
Temp: ${result.recommendedTempC}°C${!hasPID ? " (approximate with warmup/flush)" : ""}

Tips:
${result.tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n")}
    `.trim();

		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback for when clipboard API fails (e.g., document not focused)
			const textArea = document.createElement("textarea");
			textArea.value = text;
			textArea.style.position = "fixed";
			textArea.style.opacity = "0";
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="bg-coffee-dark border-2 border-amber rounded-xl p-6 md:p-8 space-y-6"
		>
			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold text-amber">Your Recipe</h2>
				<span className={`text-sm ${getConfidenceColor()}`}>
					{result.confidence.toUpperCase()} CONFIDENCE
				</span>
			</div>

			{/* Hero Numbers */}
			<div className="grid grid-cols-2 gap-3 md:gap-4">
				<div className="bg-espresso rounded-lg p-4 md:p-6 border border-coffee-medium">
					<div className="text-cream-dark text-xs sm:text-sm mb-1">Dose</div>
					<div className="text-4xl md:text-5xl font-bold text-amber">
						{result.recommendedDoseG}
					</div>
					<div className="text-cream text-xs sm:text-sm mt-1">grams</div>
				</div>

				<div className="bg-espresso rounded-lg p-4 md:p-6 border border-coffee-medium">
					<div className="text-cream-dark text-xs sm:text-sm mb-1">Grind Setting</div>
					<div className="text-4xl md:text-5xl font-bold text-amber">
						{formatGrindSetting()}
					</div>
					<div className="text-cream text-xs mt-1 truncate">
						{grinder.brand} {grinder.model}
					</div>
				</div>
			</div>

			{/* Expected Output */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
				<div className="bg-espresso rounded-lg p-4 border border-coffee-medium">
					<div className="text-cream-dark text-xs mb-1">Expected Yield</div>
					<div className="text-xl sm:text-2xl font-bold text-cream">
						{result.expectedYieldG.toFixed(1)}g
					</div>
				</div>

				<div className="bg-espresso rounded-lg p-4 border border-coffee-medium">
					<div className="text-cream-dark text-xs mb-1">Brew Time</div>
					<div className="text-xl sm:text-2xl font-bold text-cream">
						{result.expectedBrewTimeSec.min}-{result.expectedBrewTimeSec.max}s
					</div>
				</div>

				<div className="bg-espresso rounded-lg p-4 border border-coffee-medium">
					<div className="text-cream-dark text-xs mb-1">
						Brew Temp
						{!hasPID && <span className="ml-1" title="Approximate with warmup/flush">*</span>}
					</div>
					<div className="text-xl sm:text-2xl font-bold text-cream">
						{result.recommendedTempC}°C
					</div>
				</div>
			</div>

			{!hasPID && (
				<p className="text-xs text-cream-dark italic">
					* Your machine lacks PID temperature control. Use warmup time and cooling flushes to approximate this temperature.
				</p>
			)}

			{/* Tips */}
			{result.tips.length > 0 && (
				<div className="space-y-2">
					<h3 className="text-lg font-bold text-cream">Tips</h3>
					<ul className="space-y-2">
						{result.tips.map((tip, index) => (
							<motion.li
								key={index}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className="flex gap-3 text-sm text-cream-dark"
							>
								<span className="text-amber font-bold">•</span>
								<span>{tip}</span>
							</motion.li>
						))}
					</ul>
				</div>
			)}

			{/* Reasoning Section (Expandable) */}
			<div className="border-t border-coffee-medium pt-4">
				<button
					onClick={() => setShowReasoning(!showReasoning)}
					className="w-full flex items-center justify-between text-left text-cream hover:text-amber transition-colors"
				>
					<span className="font-medium">Why these settings?</span>
					<span className="text-xl">{showReasoning ? "−" : "+"}</span>
				</button>

				{showReasoning && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="mt-4 space-y-4"
					>
						{/* Dose Reasoning */}
						<div>
							<h4 className="text-sm font-bold text-amber mb-2">Dose</h4>
							<p className="text-sm text-cream-dark">
								{result.reasoning.doseReasoning}
							</p>
						</div>

						{/* Grind Reasoning */}
						<div>
							<h4 className="text-sm font-bold text-amber mb-2">
								Grind Setting
							</h4>
							<p className="text-sm text-cream-dark mb-3">
								{result.reasoning.grindReasoning}
							</p>

							{/* Adjustments */}
							{result.reasoning.adjustments.length > 0 && (
								<div className="space-y-2">
									<div className="text-xs font-medium text-cream">
										Adjustments applied:
									</div>
									<table className="w-full text-xs border-collapse table-fixed">
										<thead>
											<tr className="border-b border-coffee-medium">
												<th className="text-left py-2 pr-3 text-cream-dark font-medium" style={{width: '35%'}}>Factor</th>
												<th className="text-right py-2 pl-3 text-cream-dark font-medium" style={{width: '65%'}}>Effect</th>
											</tr>
										</thead>
										<tbody>
											{result.reasoning.adjustments.map((adj, index) => (
												<tr
													key={index}
													className="border-b border-coffee-medium/30 hover:bg-espresso transition-colors"
												>
													<td className="py-2.5 pr-3 text-cream-dark align-top break-words">{adj.factor}</td>
													<td className="py-2.5 pl-3 text-amber font-mono text-right align-top break-words">{adj.effect}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</div>

			{/* Copy Button */}
			<button
				onClick={copyRecipe}
				className="w-full px-6 py-3 bg-coffee-medium hover:bg-amber hover:text-espresso text-cream font-medium rounded-lg transition-colors"
			>
				{copied ? "Copied!" : "Copy Recipe"}
			</button>
		</motion.div>
	);
}
