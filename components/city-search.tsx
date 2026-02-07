"use client";

import { findNearestCity, searchCities } from "@/lib/geodb-cities";
import type { CityData } from "@/lib/types";
import { useRef, useState } from "react";

interface CitySearchProps {
	onSelectCity: (city: CityData) => void;
	selectedCity?: CityData | null;
}

export function CitySearch({ onSelectCity, selectedCity }: CitySearchProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [cities, setCities] = useState<CityData[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isDetecting, setIsDetecting] = useState(false);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Derive display value: show selected city or current search term
	const displayValue =
		searchTerm ||
		(selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : "");

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);

		// Clear previous timeout
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		if (value.length < 2) {
			setCities([]);
			setIsOpen(false);
			return;
		}

		// Set new timeout for debounced search
		searchTimeoutRef.current = setTimeout(async () => {
			setIsLoading(true);
			const results = await searchCities(value, 10);
			setCities(results);
			setIsOpen(results.length > 0);
			setIsLoading(false);
		}, 300);
	};

	const handleSelectCity = (city: CityData) => {
		setSearchTerm("");
		setCities([]);
		setIsOpen(false);
		onSelectCity(city);
	};

	const handleDetectLocation = () => {
		if ("geolocation" in navigator) {
			setIsDetecting(true);
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const { latitude, longitude } = position.coords;

					// Find nearest city using GeoDB
					const nearestCity = await findNearestCity(latitude, longitude, 100);

					if (nearestCity) {
						handleSelectCity(nearestCity);
					} else {
						// Fallback: use coordinates directly
						onSelectCity({
							id: 0,
							name: "Current Location",
							country: "",
							countryCode: "",
							region: "",
							latitude,
							longitude,
						});
						setSearchTerm("");
					}

					setIsDetecting(false);
				},
				(error) => {
					console.error("Geolocation error:", error);
					alert(
						"Could not detect location. Please search for your city manually.",
					);
					setIsDetecting(false);
				},
			);
		} else {
			alert("Geolocation is not supported by your browser.");
		}
	};

	return (
		<div className="space-y-3">
			<label className="block text-sm font-medium text-cream">
				City Location
			</label>

			<div className="flex gap-2">
				<div className="relative flex-1">
					<input
						type="text"
						value={displayValue}
						onChange={(e) => handleSearchChange(e.target.value)}
						onFocus={() => {
							if (cities.length > 0) setIsOpen(true);
						}}
						placeholder="Search for your city..."
						className="w-full px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-cream placeholder-cream-dark focus:outline-none focus:ring-2 focus:ring-amber"
					/>

					{isLoading && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2">
							<div className="w-5 h-5 border-2 border-amber border-t-transparent rounded-full animate-spin"></div>
						</div>
					)}

					{/* Dropdown */}
					{isOpen && cities.length > 0 && (
						<div className="absolute z-50 w-full mt-2 bg-coffee-dark border border-coffee-medium rounded-lg shadow-lg max-h-64 overflow-y-auto">
							{cities.map((city) => (
								<button
									key={city.id}
									type="button"
									onClick={() => handleSelectCity(city)}
									className="w-full px-4 py-3 text-left hover:bg-coffee-medium transition-colors border-b border-coffee-medium last:border-b-0"
								>
									<div className="text-cream font-medium">{city.name}</div>
									<div className="text-xs text-cream-dark">
										{city.region ? `${city.region}, ` : ""}
										{city.country}
									</div>
								</button>
							))}
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={handleDetectLocation}
					disabled={isDetecting}
					className="px-4 py-3 bg-amber hover:bg-amber-dark disabled:bg-coffee-medium disabled:cursor-not-allowed text-espresso font-medium rounded-lg transition-colors whitespace-nowrap"
				>
					{isDetecting ? "Detecting..." : "📍 Detect"}
				</button>
			</div>

			{selectedCity && (
				<div className="text-xs text-cream-dark">
					📍 {selectedCity.latitude.toFixed(4)},{" "}
					{selectedCity.longitude.toFixed(4)}
				</div>
			)}
		</div>
	);
}
