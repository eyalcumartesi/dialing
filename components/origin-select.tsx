"use client";

import type { OriginData } from "@/lib/types";
import { useState } from "react";

interface OriginSelectProps {
	origins: OriginData[];
	selectedId: string | null;
	onSelect: (origin: OriginData | null) => void;
}

export function OriginSelect({
	origins,
	selectedId,
	onSelect,
}: OriginSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");

	const selectedOrigin = origins.find((o) => o.id === selectedId);

	// Filter origins by search term
	const filteredOrigins = origins.filter(
		(origin) =>
			origin.country.toLowerCase().includes(search.toLowerCase()) ||
			origin.region.toLowerCase().includes(search.toLowerCase()) ||
			(origin.subRegion?.toLowerCase().includes(search.toLowerCase()) ?? false),
	);

	// Group by region
	const groupedOrigins = filteredOrigins.reduce(
		(acc, origin) => {
			const region = origin.region;
			if (!acc[region]) {
				acc[region] = [];
			}
			acc[region].push(origin);
			return acc;
		},
		{} as Record<string, OriginData[]>,
	);

	const handleSelect = (origin: OriginData | null) => {
		onSelect(origin);
		setIsOpen(false);
		setSearch("");
	};

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-cream">
				Coffee Origin{" "}
				<span className="text-cream-dark text-xs">(optional)</span>
			</label>

			<div className="relative">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="w-full px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-left text-cream hover:bg-coffee-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber"
				>
					{selectedOrigin ? (
						<div>
							<div className="font-medium">
								{selectedOrigin.country}
								{selectedOrigin.subRegion && ` - ${selectedOrigin.subRegion}`}
							</div>
							<div className="text-xs text-cream-dark">
								{selectedOrigin.region}
							</div>
						</div>
					) : (
						<span className="text-cream-dark">Select origin (or skip)</span>
					)}
				</button>

				{isOpen && (
					<div className="absolute z-50 w-full mt-2 bg-coffee-dark border border-coffee-medium rounded-lg shadow-lg max-h-[50vh] overflow-hidden">
						{/* Search */}
						<div className="p-2 border-b border-coffee-medium">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search countries or regions..."
								className="w-full px-3 py-2 bg-espresso text-cream border border-coffee-medium rounded focus:outline-none focus:ring-2 focus:ring-amber text-sm"
								autoFocus
							/>
						</div>

						{/* Clear selection option */}
						<button
							type="button"
							onClick={() => handleSelect(null)}
							className="w-full px-4 py-3 text-left text-cream-dark hover:bg-coffee-medium transition-colors border-b border-coffee-medium text-sm italic"
						>
							None / Unknown
						</button>

						{/* Grouped origins by region */}
						<div className="overflow-y-auto max-h-[40vh]">
							{Object.entries(groupedOrigins).map(([region, regionOrigins]) => (
								<div key={region}>
									<div className="px-4 py-2 bg-espresso text-amber text-xs font-bold sticky top-0">
										{region}
									</div>
									{regionOrigins.map((origin) => (
										<button
											key={origin.id}
											type="button"
											onClick={() => handleSelect(origin)}
											className={`w-full px-4 py-3 text-left hover:bg-coffee-medium transition-colors border-b border-coffee-medium/50 ${
												origin.id === selectedId ? "bg-coffee-medium" : ""
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1">
													<div
														className={`font-medium ${origin.id === selectedId ? "text-amber" : "text-cream"}`}
													>
														{origin.country}
														{origin.subRegion && (
															<span className="text-cream-dark text-xs ml-2">
																{origin.subRegion}
															</span>
														)}
													</div>
													<div className="text-xs text-cream-dark mt-1">
														{origin.characteristics.altitudeRange} •{" "}
														{origin.characteristics.soilType}
													</div>
												</div>
												<div className="text-xs text-amber font-mono shrink-0">
													{origin.extractionModifier > 0 ? "+" : ""}
													{origin.extractionModifier}%
												</div>
											</div>
											<div className="text-xs text-cream-dark mt-1 opacity-75 line-clamp-1">
												{origin.flavorProfile}
											</div>
										</button>
									))}
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Show selected origin details */}
			{selectedOrigin && (
				<div className="mt-2 p-3 bg-espresso border border-coffee-medium rounded-lg text-xs space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-amber font-bold">Terroir Impact:</span>
						<span className="text-cream font-mono">
							{selectedOrigin.extractionModifier > 0 ? "+" : ""}
							{selectedOrigin.extractionModifier}% grind adjustment
						</span>
					</div>

					<div className="text-cream-dark">
						<div className="opacity-75 mb-1">Characteristics:</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							<div className="truncate">📍 {selectedOrigin.characteristics.altitudeRange}</div>
							<div className="truncate">🌋 {selectedOrigin.characteristics.soilType}</div>
							<div className="truncate">☀️ {selectedOrigin.characteristics.climateType}</div>
							<div className="truncate">🔄 {selectedOrigin.characteristics.processingTradition}</div>
						</div>
					</div>

					<div className="text-cream-dark pt-2 border-t border-coffee-medium">
						<div className="opacity-75 text-xs">Why this matters:</div>
						<div className="text-xs mt-1">{selectedOrigin.reasoning}</div>
					</div>

					{selectedOrigin.commonVarietals.length > 0 && (
						<div className="text-cream-dark pt-2 border-t border-coffee-medium">
							<div className="opacity-75 text-xs">Common varietals:</div>
							<div className="text-xs mt-1">
								{selectedOrigin.commonVarietals.slice(0, 3).join(", ")}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
