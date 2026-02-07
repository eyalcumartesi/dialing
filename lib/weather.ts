import type { WeatherData } from "./types";

const CACHE_KEY = "dial_weather_cache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface WeatherCache {
	data: WeatherData;
	timestamp: number;
	lat: number;
	lon: number;
}

interface OpenWeatherMapResponse {
	main: {
		temp: number;
		humidity: number;
	};
}

/**
 * Check if cached weather data is still valid
 */
function isCacheValid(cache: WeatherCache, lat: number, lon: number): boolean {
	const now = Date.now();
	const age = now - cache.timestamp;

	// Check if cache is fresh and location matches
	return (
		age < CACHE_DURATION_MS &&
		Math.abs(cache.lat - lat) < 0.01 &&
		Math.abs(cache.lon - lon) < 0.01
	);
}

/**
 * Get cached weather data from localStorage
 */
function getCachedWeather(lat: number, lon: number): WeatherData | null {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (!cached) {
			return null;
		}

		const cache = JSON.parse(cached) as WeatherCache;
		if (isCacheValid(cache, lat, lon)) {
			return cache.data;
		}

		// Cache expired or location changed
		return null;
	} catch {
		return null;
	}
}

/**
 * Save weather data to localStorage cache
 */
function cacheWeather(data: WeatherData, lat: number, lon: number): void {
	try {
		const cache: WeatherCache = {
			data,
			timestamp: Date.now(),
			lat,
			lon,
		};
		localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
	} catch (error) {
		console.warn("Failed to cache weather data:", error);
	}
}

/**
 * Fetch current weather from OpenWeatherMap API
 */
export async function fetchWeather(
	lat: number,
	lon: number,
): Promise<WeatherData | null> {
	// Check cache first
	const cached = getCachedWeather(lat, lon);
	if (cached) {
		return cached;
	}

	// Check if API key is available
	const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
	if (!apiKey) {
		console.warn(
			"OpenWeatherMap API key not configured. Weather adjustments will be skipped.",
		);
		return null;
	}

	try {
		const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
		const response = await fetch(url);

		if (!response.ok) {
			console.error("Weather API request failed:", response.statusText);
			return null;
		}

		const data = (await response.json()) as OpenWeatherMapResponse;
		const weatherData: WeatherData = {
			temperatureC: data.main.temp,
			humidity: data.main.humidity,
		};

		// Cache the result
		cacheWeather(weatherData, lat, lon);

		return weatherData;
	} catch (error) {
		console.error("Failed to fetch weather data:", error);
		return null;
	}
}

/**
 * Get default weather data for when API is unavailable
 * Uses neutral values that won't skew the algorithm
 */
export function getDefaultWeather(): WeatherData {
	return {
		temperatureC: 20, // Room temperature
		humidity: 50, // Mid-range humidity
	};
}
