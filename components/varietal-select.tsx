"use client";

import type { VarietalData } from "@/lib/types";
import { useState } from "react";

interface VarietalSelectProps {
	varietals: VarietalData[];
	selectedId: string | null;
	onSelect: (varietal: VarietalData | null) => void;
}

export function VarietalSelect({
	varietals,
	selectedId,
	onSelect,
}: VarietalSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");

	const selectedVarietal = varietals.find((v) => v.id === selectedId);

	// Filter varietals by search term
	const filteredVarietals = varietals.filter(
		(varietal) =>
			varietal.name.toLowerCase().includes(search.toLowerCase()) ||
			varietal.species.toLowerCase().includes(search.toLowerCase()),
	);

	// Group by species for better organization
	const groupedVarietals = filteredVarietals.reduce(
		(acc, varietal) => {
			const species = varietal.species;
			if (!acc[species]) {
				acc[species] = [];
			}
			acc[species].push(varietal);
			return acc;
		},
		{} as Record<string, VarietalData[]>,
	);

	const handleSelect = (varietal: VarietalData | null) => {
		onSelect(varietal);
		setIsOpen(false);
		setSearch("");
	};

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-cream">
				Coffee Varietal{" "}
				<span className="text-cream-dark text-xs">(optional)</span>
			</label>

			<div className="relative">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="w-full px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-left text-cream hover:bg-coffee-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber"
				>
					{selectedVarietal ? (
						<div>
							<div className="font-medium">{selectedVarietal.name}</div>
							<div className="text-xs text-cream-dark">
								{selectedVarietal.species}
							</div>
						</div>
					) : (
						<span className="text-cream-dark">Select varietal (or skip)</span>
					)}
				</button>

				{isOpen && (
					<div className="absolute z-50 w-full mt-2 bg-coffee-dark border border-coffee-medium rounded-lg shadow-lg max-h-96 overflow-hidden">
						{/* Search */}
						<div className="p-2 border-b border-coffee-medium">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search varietals..."
								className="w-full px-3 py-2 bg-espresso text-cream border border-coffee-medium rounded focus:outline-none focus:ring-2 focus:ring-amber text-sm"
								autoFocus
							/>
						</div>

						{/* Clear selection option */}
						<button
							type="button"
							onClick={() => handleSelect(null)}
							className="w-full px-4 py-2 text-left text-cream-dark hover:bg-coffee-medium transition-colors border-b border-coffee-medium text-sm italic"
						>
							None / Unknown
						</button>

						{/* Grouped varietals */}
						<div className="overflow-y-auto max-h-80">
							{Object.entries(groupedVarietals).map(([species, vars]) => (
								<div key={species}>
									<div className="px-4 py-2 bg-espresso text-amber text-xs font-bold sticky top-0">
										{species}
									</div>
									{vars.map((varietal) => (
										<button
											key={varietal.id}
											type="button"
											onClick={() => handleSelect(varietal)}
											className={`w-full px-4 py-3 text-left hover:bg-coffee-medium transition-colors border-b border-coffee-medium/50 ${
												varietal.id === selectedId ? "bg-coffee-medium" : ""
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1">
													<div
														className={`font-medium ${varietal.id === selectedId ? "text-amber" : "text-cream"}`}
													>
														{varietal.name}
													</div>
													<div className="text-xs text-cream-dark mt-1 line-clamp-2">
														{varietal.flavorProfile}
													</div>
												</div>
												<div className="text-xs text-amber font-mono shrink-0">
													{varietal.extractionModifier > 0 ? "+" : ""}
													{varietal.extractionModifier}%
												</div>
											</div>
											<div className="text-xs text-cream-dark mt-1 opacity-75">
												{varietal.notes}
											</div>
										</button>
									))}
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Show selected varietal details */}
			{selectedVarietal && (
				<div className="mt-2 p-3 bg-espresso border border-coffee-medium rounded-lg text-xs">
					<div className="flex items-center justify-between mb-2">
						<span className="text-amber font-bold">Extraction Impact:</span>
						<span className="text-cream font-mono">
							{selectedVarietal.extractionModifier > 0 ? "+" : ""}
							{selectedVarietal.extractionModifier}% grind adjustment
						</span>
					</div>
					<div className="grid grid-cols-2 gap-2 text-cream-dark">
						<div>
							<span className="opacity-75">Density:</span>{" "}
							{selectedVarietal.characteristics.beanDensity}
						</div>
						<div>
							<span className="opacity-75">Size:</span>{" "}
							{selectedVarietal.characteristics.beanSize}
						</div>
						<div>
							<span className="opacity-75">Solubility:</span>{" "}
							{selectedVarietal.characteristics.solubility}
						</div>
						<div>
							<span className="opacity-75">Sugar:</span>{" "}
							{selectedVarietal.characteristics.sugarContent}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
