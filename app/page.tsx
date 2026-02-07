"use client";

import AdUnit from "@/components/ad-unit";
import { BrewForm } from "@/components/brew-form";
import { FAQ } from "@/components/faq";
import { ResultCard } from "@/components/result-card";
import { WeatherBadge } from "@/components/weather-badge";
import { calculateRecipe } from "@/lib/algorithm";
import { useStoredProfile } from "@/lib/hooks/use-stored-profile";
import type {
	AlgorithmOutput,
	BeanInfo,
	BrewTargets,
	WeatherData,
} from "@/lib/types";
import { fetchWeather, getDefaultWeather } from "@/lib/weather";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Home() {
	const router = useRouter();
	const profile = useStoredProfile();
	const [weather, setWeather] = useState<WeatherData | null>(null);
	const [weatherLoading, setWeatherLoading] = useState(false);
	const [weatherError, setWeatherError] = useState(false);
	const [result, setResult] = useState<AlgorithmOutput | null>(null);
	const isMountedRef = useRef(true);

	// Track component mount status to prevent state updates on unmounted component
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Fetch weather when profile is available
	useEffect(() => {
		if (!profile) return;

		// Capture ENTIRE location object to detect race conditions
		// This prevents accessing profile.location after it might have changed
		const requestLocation = {
			lat: profile.location.lat,
			lon: profile.location.lon,
		};
		const abortController = new AbortController();

		setWeatherLoading(true);
		setWeatherError(false);

		fetchWeather(requestLocation.lat, requestLocation.lon, abortController.signal)
			.then((weatherData) => {
				// Guard against race condition: only update if location hasn't changed
				if (!isMountedRef.current || abortController.signal.aborted) return;
				if (
					profile.location.lat !== requestLocation.lat ||
					profile.location.lon !== requestLocation.lon
				) {
					console.log("Weather fetch aborted: location changed");
					return;
				}

				setWeather(weatherData || getDefaultWeather());
				setWeatherError(false);
			})
			.catch((error) => {
				if (!isMountedRef.current || abortController.signal.aborted) return;
				// Also check location hasn't changed for error handling
				if (
					profile.location.lat !== requestLocation.lat ||
					profile.location.lon !== requestLocation.lon
				) {
					return;
				}

				console.error("Failed to fetch weather:", error);
				setWeather(getDefaultWeather());
				setWeatherError(true);
			})
			.finally(() => {
				if (!isMountedRef.current || abortController.signal.aborted) return;
				// Check location one more time before clearing loading state
				if (
					profile.location.lat !== requestLocation.lat ||
					profile.location.lon !== requestLocation.lon
				) {
					return;
				}

				setWeatherLoading(false);
			});

		return () => {
			abortController.abort();
		};
	}, [profile]);

	// Show onboarding if no profile exists
	const showOnboarding = profile === null;

	const handleCalculate = (bean: BeanInfo, targets: BrewTargets) => {
		if (!profile) {
			// This should never happen due to showOnboarding check, but just in case
			router.push("/profile");
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
							{weatherLoading ? (
								<div className="text-sm text-cream-dark">
									Loading weather...
								</div>
							) : weatherError ? (
								<div
									className="text-sm text-yellow-600"
									title="Using default weather values"
								>
									Weather unavailable (using defaults)
								</div>
							) : weather ? (
								<WeatherBadge weather={weather} city={profile?.location.city} />
							) : null}
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
							<ResultCard
								result={result}
								grinder={profile.grinder}
								hasPID={profile.machine.hasPID}
							/>
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

				{/* FAQ Section */}
				<FAQ />

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
