"use client";

import AdUnit from "@/components/ad-unit";
import { BrewForm } from "@/components/brew-form";
import { ResultCard } from "@/components/result-card";
import { WeatherBadge } from "@/components/weather-badge";
import { calculateRecipe } from "@/lib/algorithm";
import { hasProfile, loadProfile } from "@/lib/profile";
import type {
	AlgorithmOutput,
	BeanInfo,
	BrewTargets,
	WeatherData,
} from "@/lib/types";
import { fetchWeather, getDefaultWeather } from "@/lib/weather";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Hook to read profile from localStorage using useSyncExternalStore
function useStoredProfile() {
	const cachedProfile = useRef<ReturnType<typeof loadProfile> | null>(null);
	const cachedJson = useRef<string | null>(null);

	const subscribe = useCallback((callback: () => void) => {
		// Listen for both cross-window (storage) and same-window (localStorage-update) changes
		window.addEventListener("storage", callback);
		window.addEventListener("localStorage-update", callback);
		return () => {
			window.removeEventListener("storage", callback);
			window.removeEventListener("localStorage-update", callback);
		};
	}, []);

	const getSnapshot = useCallback(() => {
		const currentJson = typeof window !== "undefined"
			? localStorage.getItem("dial_profile")
			: null;

		// Only update cached profile if the underlying data changed
		if (currentJson !== cachedJson.current) {
			cachedJson.current = currentJson;
			cachedProfile.current = hasProfile() ? loadProfile() : null;
		}

		return cachedProfile.current;
	}, []);

	const getServerSnapshot = useCallback(() => null, []);

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function Home() {
	const router = useRouter();
	const profile = useStoredProfile();
	const [weather, setWeather] = useState<WeatherData | null>(null);
	const [result, setResult] = useState<AlgorithmOutput | null>(null);

	// Fetch weather when profile is available
	useEffect(() => {
		if (!profile) return;

		fetchWeather(profile.location.lat, profile.location.lon).then(
			(weatherData) => {
				setWeather(weatherData || getDefaultWeather());
			},
		);
	}, [profile]);

	// Show onboarding if no profile exists
	const showOnboarding = profile === null;

	const handleCalculate = (bean: BeanInfo, targets: BrewTargets) => {
		if (!profile) {
			alert("Please set up your profile first");
			return;
		}

		const input = {
			profile,
			bean,
			targets,
			weather: weather || getDefaultWeather(),
		};

		const calculatedResult = calculateRecipe(input);
		setResult(calculatedResult);

		// Scroll to result
		setTimeout(() => {
			document.getElementById("result")?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}, 100);
	};

	if (showOnboarding) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="max-w-md text-center space-y-6"
				>
					<h1 className="text-5xl font-bold text-amber">Welcome to Dial</h1>
					<p className="text-cream-dark text-lg">
						Get personalized espresso recipes based on your equipment, beans,
						and environment.
					</p>
					<p className="text-cream">
						First, let&apos;s set up your equipment profile.
					</p>
					<button
						onClick={() => router.push("/profile")}
						className="px-8 py-4 bg-amber hover:bg-amber-dark text-espresso font-bold rounded-lg transition-colors text-lg"
					>
						Set Up Profile
					</button>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<motion.header
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-8"
				>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
						<h1 className="text-5xl md:text-6xl font-bold text-amber">Dial</h1>
						<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
							{weather && (
								<WeatherBadge weather={weather} city={profile?.location.city} />
							)}
							<button
								onClick={() => router.push("/profile")}
								className="text-sm text-cream-dark hover:text-cream transition-colors"
							>
								Edit Profile →
							</button>
						</div>
					</div>
					<p className="text-cream-dark text-lg">
						Your personalized espresso recipe calculator
					</p>
					{profile && (
						<p className="text-cream text-sm mt-2">
							{profile.machine.brand} {profile.machine.model} •{" "}
							{profile.grinder.brand} {profile.grinder.model}
						</p>
					)}
				</motion.header>

				{/* Top Ad Banner */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.15 }}
					className="mb-8"
				>
					<AdUnit slot="top-banner" format="auto" responsive={true} />
				</motion.div>

				{/* Main Content */}
				<div className="grid gap-8 lg:grid-cols-2">
					{/* Brew Form */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
						className="bg-coffee-dark border border-coffee-medium rounded-xl p-6 md:p-8"
					>
						<BrewForm onCalculate={handleCalculate} />
					</motion.div>

					{/* Result */}
					<div id="result">
						{result && profile ? (
							<ResultCard result={result} grinder={profile.grinder} hasPID={profile.machine.hasPID} />
						) : (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="bg-coffee-dark border border-coffee-medium rounded-xl p-6 md:p-8 flex items-center justify-center min-h-[400px]"
							>
								<div className="text-center space-y-3">
									<div className="text-6xl">☕</div>
									<p className="text-cream-dark">
										Fill in your bean info and preferences, then calculate your
										recipe
									</p>
								</div>
							</motion.div>
						)}
					</div>
				</div>

				{/* Bottom Ad Banner */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="mt-8"
				>
					<AdUnit slot="bottom-banner" format="auto" responsive={true} />
				</motion.div>

				{/* Footer */}
				<motion.footer
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="mt-12 text-center text-cream-dark text-sm"
				>
					<p>
						Dial uses a deterministic algorithm to recommend grind and dose
						settings based on your equipment and environment.
					</p>
					<p className="mt-2">
						Remember: These are starting points. Adjust to your taste!
					</p>
				</motion.footer>
			</div>
		</div>
	);
}
