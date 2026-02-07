import type { WeatherData } from "./types";

const CACHE_KEY = "dial_weather_cache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
/**
 * Location tolerance for weather cache in degrees.
 * 0.01 degrees ≈ 1.1 km at equator, sufficient for local weather consistency.
 */
const LOCATION_TOLERANCE_DEGREES = 0.01;

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
		Math.abs(cache.lat - lat) < LOCATION_TOLERANCE_DEGREES &&
		Math.abs(cache.lon - lon) < LOCATION_TOLERANCE_DEGREES
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

		// Validate cache structure to prevent corrupted data issues
		if (
			!cache ||
			typeof cache !== "object" ||
			!cache.data ||
			cache.timestamp === undefined ||
			cache.lat === undefined ||
			cache.lon === undefined
		) {
			console.warn("Invalid weather cache structure, clearing cache");
			localStorage.removeItem(CACHE_KEY);
			return null;
		}

		if (isCacheValid(cache, lat, lon)) {
			return cache.data;
		}

		// Cache expired or location changed
		return null;
	} catch (error) {
		// Clear corrupted cache on parse error
		console.error("Failed to parse weather cache, clearing:", error);
		try {
			localStorage.removeItem(CACHE_KEY);
		} catch {
			// Silently fail if localStorage is unavailable
		}
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
	signal?: AbortSignal,
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
		const response = await fetch(url, { signal });

		if (!response.ok) {
			console.error("Weather API request failed:", response.statusText);
			return null;
		}

		const data = (await response.json()) as OpenWeatherMapResponse;

		// Validate response structure and numeric types to prevent NaN propagation
		if (
			!data ||
			typeof data !== "object" ||
			!data.main ||
			typeof data.main !== "object" ||
			typeof data.main.temp !== "number" ||
			typeof data.main.humidity !== "number" ||
			isNaN(data.main.temp) ||
			isNaN(data.main.humidity)
		) {
			console.error("Invalid OpenWeatherMap response structure:", data);
			return null;
		}

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
