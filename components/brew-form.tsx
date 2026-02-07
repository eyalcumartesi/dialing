"use client";

import blendsData from "@/data/blends.json";
import originsData from "@/data/origins.json";
import varietalsData from "@/data/varietals.json";
import type {
	BeanInfo,
	BeanType,
	BlendProfile,
	BrewTargets,
	OriginData,
	VarietalData,
} from "@/lib/types";
import { useState } from "react";
import { FreshnessIndicator } from "./freshness-indicator";
import { OriginSelect } from "./origin-select";
import { VarietalSelect } from "./varietal-select";

interface BrewFormProps {
	onCalculate: (bean: BeanInfo, targets: BrewTargets) => void;
}

export function BrewForm({ onCalculate }: BrewFormProps) {
	// Bean type state
	const [beanType, setBeanType] = useState<BeanType>("single-origin");

	// Bean state
	const [roastLevel, setRoastLevel] =
		useState<BeanInfo["roastLevel"]>("medium");
	const [processMethod, setProcessMethod] =
		useState<BeanInfo["processMethod"]>("washed");
	const [roastDate, setRoastDate] = useState("");

	// Single origin state
	const [selectedVarietal, setSelectedVarietal] = useState<VarietalData | null>(
		null,
	);
	const [selectedOrigin, setSelectedOrigin] = useState<OriginData | null>(null);

	// Blend state
	const [blendProfile, setBlendProfile] = useState<BlendProfile>("balanced");
	const [dominantOrigin, setDominantOrigin] = useState<OriginData | null>(null);

	// Target state
	const [ratio, setRatio] = useState(2);
	const [brewTimeMin, setBrewTimeMin] = useState(25);
	const [brewTimeMax, setBrewTimeMax] = useState(30);
	const [tastePreference, setTastePreference] =
		useState<BrewTargets["tastePreference"]>("balanced");

	// Calculate days since roast
	const calculateDaysAgo = (): number => {
		if (!roastDate) return 14; // Default to 2 weeks
		const roastDateObj = new Date(roastDate);
		const today = new Date();
		const diffTime = Math.abs(today.getTime() - roastDateObj.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const daysAgo = calculateDaysAgo();

		const bean: BeanInfo = {
			beanType,
			roastLevel,
			processMethod,
			roastDateDaysAgo: daysAgo,
			// Single origin fields
			...(beanType === "single-origin" && {
				originId: selectedOrigin?.id,
				varietalId: selectedVarietal?.id,
			}),
			// Blend fields
			...(beanType === "blend" && {
				blendProfile,
				dominantOriginId: dominantOrigin?.id,
			}),
		};

		const targets: BrewTargets = {
			ratio,
			brewTimeMinSec: brewTimeMin,
			brewTimeMaxSec: brewTimeMax,
			tastePreference,
		};

		onCalculate(bean, targets);
	};

	const ratioPresets = [
		{ ratio: 1.5, label: "Ristretto" },
		{ ratio: 2, label: "Standard" },
		{ ratio: 2.5, label: "Lungo-ish" },
		{ ratio: 3, label: "Lungo" },
	];

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Bean Information */}
			<section className="space-y-4">
				<h2 className="text-2xl font-bold text-cream">Bean Information</h2>

				{/* Bean Type Toggle */}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-cream">
						Bean Type
					</label>
					<div className="grid grid-cols-2 gap-2">
						<button
							type="button"
							onClick={() => setBeanType("single-origin")}
							className={`px-4 py-2 rounded-lg border transition-colors ${
								beanType === "single-origin"
									? "bg-amber border-amber text-espresso font-medium"
									: "bg-coffee-dark border-coffee-medium text-cream hover:bg-coffee-medium"
							}`}
						>
							Single Origin
						</button>
						<button
							type="button"
							onClick={() => setBeanType("blend")}
							className={`px-4 py-2 rounded-lg border transition-colors ${
								beanType === "blend"
									? "bg-amber border-amber text-espresso font-medium"
									: "bg-coffee-dark border-coffee-medium text-cream hover:bg-coffee-medium"
							}`}
						>
							Blend
						</button>
					</div>
				</div>

				{/* Roast Level */}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-cream">
						Roast Level
					</label>
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
						{(
							[
								"light",
								"medium-light",
								"medium",
								"medium-dark",
								"dark",
							] as const
						).map((level) => (
							<button
								key={level}
								type="button"
								onClick={() => setRoastLevel(level)}
								className={`px-4 py-2 rounded-lg border transition-colors capitalize ${
									roastLevel === level
										? "bg-amber border-amber text-espresso font-medium"
										: "bg-coffee-dark border-coffee-medium text-cream hover:bg-coffee-medium"
								}`}
							>
								{level}
							</button>
						))}
					</div>
				</div>

				{/* Process Method */}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-cream">
						Process Method
					</label>
					<select
						value={processMethod}
						onChange={(e) =>
							setProcessMethod(e.target.value as BeanInfo["processMethod"])
						}
						className="w-full px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-amber"
					>
						<option value="washed">Washed</option>
						<option value="natural">Natural</option>
						<option value="honey">Honey</option>
						<option value="anaerobic">Anaerobic</option>
						<option value="other">Other</option>
					</select>
				</div>

				{/* Roast Date */}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-cream">
						Roast Date
					</label>
					<div className="flex items-center gap-3">
						<input
							type="date"
							value={roastDate}
							onChange={(e) => setRoastDate(e.target.value)}
							className="flex-1 px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-amber"
						/>
						{roastDate && <FreshnessIndicator daysAgo={calculateDaysAgo()} />}
					</div>
				</div>

				{/* Conditional Fields Based on Bean Type */}
				{beanType === "single-origin" ? (
					<>
						{/* Varietal (optional) */}
						<VarietalSelect
							varietals={varietalsData as VarietalData[]}
							selectedId={selectedVarietal?.id || null}
							onSelect={setSelectedVarietal}
						/>

						{/* Origin (optional) */}
						<OriginSelect
							origins={originsData as OriginData[]}
							selectedId={selectedOrigin?.id || null}
							onSelect={setSelectedOrigin}
						/>
					</>
				) : (
					<>
						{/* Blend Profile */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-cream">
								Blend Profile
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{blendsData
									.filter((b) => b.id !== "unknown")
									.map((blend) => (
										<button
											key={blend.id}
											type="button"
											onClick={() => setBlendProfile(blend.id as BlendProfile)}
											className={`px-4 py-3 rounded-lg border transition-colors text-left ${
												blendProfile === blend.id
													? "bg-amber border-amber text-espresso"
													: "bg-coffee-dark border-coffee-medium text-cream hover:bg-coffee-medium"
											}`}
										>
											<div
												className={`font-medium text-sm ${blendProfile === blend.id ? "text-espresso" : "text-cream"}`}
											>
												{blend.name}
											</div>
											<div
												className={`text-xs mt-1 ${blendProfile === blend.id ? "text-espresso/80" : "text-cream-dark"}`}
											>
												{blend.flavorNotes}
											</div>
										</button>
									))}
							</div>

							{/* Unknown option as separate button */}
							<button
								type="button"
								onClick={() => setBlendProfile("unknown")}
								className={`w-full px-4 py-2 rounded-lg border transition-colors text-sm italic ${
									blendProfile === "unknown"
										? "bg-amber border-amber text-espresso"
										: "bg-coffee-dark border-coffee-medium text-cream-dark hover:bg-coffee-medium"
								}`}
							>
								Unknown / Custom Blend
							</button>

							{/* Show selected blend details */}
							{blendProfile !== "unknown" && (
								<div className="mt-2 p-3 bg-espresso border border-coffee-medium rounded-lg text-xs space-y-2">
									{(() => {
										const selected = blendsData.find(
											(b) => b.id === blendProfile,
										);
										return selected ? (
											<>
												<div className="text-cream-dark">
													<div className="opacity-75 mb-1">
														Typical Components:
													</div>
													<ul className="space-y-1">
														{selected.commonComponents.map(
															(comp: string, i: number) => (
																<li key={i} className="flex items-start gap-2">
																	<span className="text-amber">•</span>
																	<span>{comp}</span>
																</li>
															),
														)}
													</ul>
												</div>
												<div className="flex items-center justify-between pt-2 border-t border-coffee-medium">
													<span className="text-amber font-bold">
														Extraction Impact:
													</span>
													<span className="text-cream font-mono">
														{selected.extractionModifier > 0 ? "+" : ""}
														{selected.extractionModifier / 10}% grind adjustment
													</span>
												</div>
											</>
										) : null;
									})()}
								</div>
							)}
						</div>

						{/* Dominant Origin (optional) */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-cream">
								Dominant Origin{" "}
								<span className="text-cream-dark text-xs">
									(optional - check your bag)
								</span>
							</label>
							<div className="text-xs text-cream-dark mb-2">
								If known, select the main origin ({">"}50%). This applies a
								subtle terroir adjustment.
							</div>
							<OriginSelect
								origins={originsData as OriginData[]}
								selectedId={dominantOrigin?.id || null}
								onSelect={setDominantOrigin}
							/>
						</div>
					</>
				)}
			</section>

			{/* Desired Output */}
			<section className="space-y-4">
				<h2 className="text-2xl font-bold text-cream">Desired Output</h2>

				{/* Target Ratio */}
				<div className="space-y-3">
					<label className="block text-sm font-medium text-cream">
						Target Ratio (1:{ratio})
					</label>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
						{ratioPresets.map((preset) => (
							<button
								key={preset.ratio}
								type="button"
								onClick={() => setRatio(preset.ratio)}
								className={`px-4 py-2 rounded-lg border transition-colors ${
									ratio === preset.ratio
										? "bg-amber border-amber text-espresso font-medium"
										: "bg-coffee-dark border-coffee-medium text-cream hover:bg-coffee-medium"
								}`}
							>
								<div className="text-sm">{preset.label}</div>
								<div className="text-xs opacity-75">1:{preset.ratio}</div>
							</button>
						))}
					</div>
					<input
						type="range"
						min="1.5"
						max="3"
						step="0.1"
						value={ratio}
						onChange={(e) => setRatio(parseFloat(e.target.value))}
						className="w-full accent-amber"
					/>
				</div>

				{/* Brew Time Range */}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-cream">
						Target Brew Time: {brewTimeMin}s - {brewTimeMax}s
					</label>
					<div className="flex gap-4">
						<div className="flex-1">
							<label className="block text-xs text-cream-dark mb-1">Min</label>
							<input
								type="number"
								min="20"
								max="40"
								value={brewTimeMin}
								onChange={(e) => setBrewTimeMin(parseInt(e.target.value))}
								className="w-full px-3 py-2 bg-coffee-dark border border-coffee-medium rounded text-cream focus:outline-none focus:ring-2 focus:ring-amber"
							/>
						</div>
						<div className="flex-1">
							<label className="block text-xs text-cream-dark mb-1">Max</label>
							<input
								type="number"
								min="20"
								max="40"
								value={brewTimeMax}
								onChange={(e) => setBrewTimeMax(parseInt(e.target.value))}
								className="w-full px-3 py-2 bg-coffee-dark border border-coffee-medium rounded text-cream focus:outline-none focus:ring-2 focus:ring-amber"
							/>
						</div>
					</div>
				</div>

				{/* Taste Preference */}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-cream">
						Taste Preference
					</label>
					<div className="grid grid-cols-2 gap-2">
						{(["balanced", "body", "sweetness", "bright"] as const).map(
							(pref) => (
								<button
									key={pref}
									type="button"
									onClick={() => setTastePreference(pref)}
									className={`px-4 py-2 rounded-lg border transition-colors capitalize ${
										tastePreference === pref
											? "bg-amber border-amber text-espresso font-medium"
											: "bg-coffee-dark border-coffee-medium text-cream hover:bg-coffee-medium"
									}`}
								>
									{pref === "body"
										? "Body/Intensity"
										: pref === "sweetness"
											? "Sweetness/Clarity"
											: pref === "bright"
												? "Bright/Acidic"
												: pref}
								</button>
							),
						)}
					</div>
				</div>
			</section>

			{/* Submit Button */}
			<button
				type="submit"
				className="w-full px-6 py-4 bg-amber hover:bg-amber-dark text-espresso font-bold rounded-lg transition-colors text-lg"
			>
				Calculate Recipe
			</button>
		</form>
	);
}
