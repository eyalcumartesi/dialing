"use client";

import type {
	Basket,
	BasketType,
	CityData,
	GrinderData,
	Location,
	MachineData,
	UserProfile,
} from "@/lib/types";
import { useState } from "react";
import { CitySearch } from "./city-search";
import { GrinderSelect, MachineSelect } from "./equipment-select";

interface ProfileFormProps {
	machines: MachineData[];
	grinders: GrinderData[];
	initialProfile?: UserProfile | null;
	onSave: (profile: UserProfile) => void;
}

export function ProfileForm({
	machines,
	grinders,
	initialProfile,
	onSave,
}: ProfileFormProps) {
	const [name, setName] = useState(initialProfile?.name || "");
	const [selectedMachine, setSelectedMachine] = useState<MachineData | null>(
		initialProfile
			? machines.find(
					(m) =>
						m.brand === initialProfile.machine.brand &&
						m.model === initialProfile.machine.model,
				) || null
			: null,
	);
	const [selectedGrinder, setSelectedGrinder] = useState<GrinderData | null>(
		initialProfile
			? grinders.find(
					(g) =>
						g.brand === initialProfile.grinder.brand &&
						g.model === initialProfile.grinder.model,
				) || null
			: null,
	);

	// Basket state
	const [basketType, setBasketType] = useState<BasketType>(
		initialProfile?.basket.type || "non-pressurized",
	);
	const [basketSize, setBasketSize] = useState(
		initialProfile?.basket.sizeMm || 58,
	);
	const [basketCapacityMin, setBasketCapacityMin] = useState(
		initialProfile?.basket.capacityMinG || 16,
	);
	const [basketCapacityMax, setBasketCapacityMax] = useState(
		initialProfile?.basket.capacityMaxG || 20,
	);
	const [isBottomless, setIsBottomless] = useState(
		initialProfile?.basket.isBottomless || false,
	);

	// Location state - use CityData
	const [selectedCity, setSelectedCity] = useState<CityData | null>(
		initialProfile
			? {
					id: 0,
					name: initialProfile.location.city,
					country: initialProfile.location.country,
					countryCode: "",
					region: "",
					latitude: initialProfile.location.lat,
					longitude: initialProfile.location.lon,
				}
			: null,
	);

	const handleCitySelect = (city: CityData) => {
		setSelectedCity(city);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedMachine || !selectedGrinder) {
			alert("Please select both a machine and grinder");
			return;
		}

		if (!selectedCity) {
			alert("Please select your city location");
			return;
		}

		const basket: Basket = {
			type: basketType,
			sizeMm: basketSize,
			capacityMinG: basketCapacityMin,
			capacityMaxG: basketCapacityMax,
			isBottomless,
		};

		const location: Location = {
			lat: selectedCity.latitude,
			lon: selectedCity.longitude,
			city: selectedCity.name,
			country: selectedCity.country,
		};

		const profile: UserProfile = {
			name: name || undefined,
			location,
			machine: selectedMachine,
			grinder: selectedGrinder,
			basket,
		};

		onSave(profile);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Name */}
			<div className="space-y-2">
				<label className="block text-sm font-medium text-cream">
					Your Name <span className="text-cream-dark text-xs">(optional)</span>
				</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g., Alex"
					className="w-full px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-cream placeholder-cream-dark focus:outline-none focus:ring-2 focus:ring-amber"
				/>
			</div>

			{/* Location */}
			<div className="space-y-4">
				<h3 className="text-xl font-bold text-cream">Location</h3>
				<CitySearch
					onSelectCity={handleCitySelect}
					selectedCity={selectedCity}
				/>
			</div>

			{/* Equipment */}
			<div className="space-y-4">
				<h3 className="text-xl font-bold text-cream">Equipment</h3>

				<MachineSelect
					machines={machines}
					selectedId={selectedMachine?.id || null}
					onSelect={setSelectedMachine}
				/>

				<GrinderSelect
					grinders={grinders}
					selectedId={selectedGrinder?.id || null}
					onSelect={setSelectedGrinder}
				/>
			</div>

			{/* Basket */}
			<div className="space-y-4">
				<h3 className="text-xl font-bold text-cream">Basket</h3>

				<div className="space-y-2">
					<label className="block text-sm font-medium text-cream">Type</label>
					<div className="grid grid-cols-3 gap-2">
						{(["pressurized", "non-pressurized", "precision"] as const).map(
							(type) => (
								<button
									key={type}
									type="button"
									onClick={() => setBasketType(type)}
									className={`px-4 py-2 rounded-lg border transition-colors text-sm ${
										basketType === type
											? "bg-amber border-amber text-espresso font-medium"
											: "bg-coffee-dark border-coffee-medium text-cream hover:bg-coffee-medium"
									}`}
								>
									{type === "precision" ? "IMS/VST" : type}
								</button>
							),
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<label className="block text-sm font-medium text-cream">
							Size (mm)
						</label>
						<select
							value={basketSize}
							onChange={(e) => setBasketSize(parseInt(e.target.value))}
							className="w-full px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-amber"
						>
							<option value={51}>51mm</option>
							<option value={54}>54mm</option>
							<option value={58}>58mm</option>
						</select>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-cream">
							Capacity (g)
						</label>
						<div className="flex gap-2 items-center">
							<input
								type="number"
								value={basketCapacityMin}
								onChange={(e) => setBasketCapacityMin(parseInt(e.target.value))}
								className="w-full px-3 py-2 bg-coffee-dark border border-coffee-medium rounded text-cream focus:outline-none focus:ring-2 focus:ring-amber"
								placeholder="Min"
							/>
							<span className="text-cream">-</span>
							<input
								type="number"
								value={basketCapacityMax}
								onChange={(e) => setBasketCapacityMax(parseInt(e.target.value))}
								className="w-full px-3 py-2 bg-coffee-dark border border-coffee-medium rounded text-cream focus:outline-none focus:ring-2 focus:ring-amber"
								placeholder="Max"
							/>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<input
						type="checkbox"
						id="bottomless"
						checked={isBottomless}
						onChange={(e) => setIsBottomless(e.target.checked)}
						className="w-5 h-5 accent-amber"
					/>
					<label htmlFor="bottomless" className="text-sm text-cream">
						Bottomless / Naked Portafilter
					</label>
				</div>
			</div>

			{/* Submit */}
			<button
				type="submit"
				className="w-full px-6 py-4 bg-amber hover:bg-amber-dark text-espresso font-bold rounded-lg transition-colors text-lg"
			>
				Save Profile
			</button>
		</form>
	);
}
