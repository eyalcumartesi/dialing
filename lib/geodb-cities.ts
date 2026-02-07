import type { CityData } from "./types";

const GEODB_BASE_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory leaks

interface GeoCityResponse {
	id: number;
	wikiDataId: string;
	type: string;
	city?: string;
	name: string;
	country: string;
	countryCode: string;
	region: string;
	regionCode: string;
	latitude: number;
	longitude: number;
	population: number;
}

interface GeoDBResponse {
	data: GeoCityResponse[];
	metadata: {
		currentOffset: number;
		totalCount: number;
	};
}

// Simple in-memory cache with size limiting
const cache = new Map<string, { data: CityData[]; timestamp: number }>();

/**
 * Manage cache size by removing oldest entries when limit is reached
 * Uses FIFO eviction strategy
 */
function pruneCache() {
	// Remove entries until we're below the limit, leaving room for new entry
	// This prevents cache from growing beyond MAX_CACHE_SIZE in rapid-fire scenarios
	while (cache.size >= MAX_CACHE_SIZE) {
		const firstKey = cache.keys().next().value;
		if (firstKey) {
			cache.delete(firstKey);
		} else {
			break; // Safety: prevent infinite loop
		}
	}
}

/**
 * Search cities by name prefix using GeoDB Cities API
 * Free tier: 86,400 requests/day via RapidAPI
 */
export async function searchCities(
	namePrefix: string,
	limit: number = 10,
	signal?: AbortSignal,
): Promise<CityData[]> {
	if (!namePrefix || namePrefix.length < 2) {
		return [];
	}

	// Check if API key is available
	const apiKey = process.env.NEXT_PUBLIC_GEODB_API_KEY;
	if (!apiKey) {
		console.warn(
			"GeoDB API key not configured. City search will not work. Get a free key at https://rapidapi.com/wirefreethought/api/geodb-cities",
		);
		return [];
	}

	try {
		const params = new URLSearchParams({
			namePrefix: namePrefix,
			limit: limit.toString(),
			offset: "0",
			sort: "-population", // Sort by population descending for most relevant results
			types: "CITY", // Only cities, not administrative regions
		});

		// Create deterministic cache key from actual params to ensure consistency
		const cacheKey = `search:${namePrefix.toLowerCase()}|limit:${params.get("limit")}|offset:${params.get("offset")}|sort:${params.get("sort")}|types:${params.get("types")}`;
		const cached = cache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
			return cached.data;
		}

		const url = `${GEODB_BASE_URL}/places?${params.toString()}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"x-rapidapi-key": apiKey,
				"x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
			},
			signal,
		});

		if (!response.ok) {
			console.error("GeoDB API request failed:", response.statusText);
			return [];
		}

		const data = (await response.json()) as GeoDBResponse;

		// Validate response structure
		if (!data || !data.data || !Array.isArray(data.data)) {
			console.error("Invalid GeoDB response structure:", data);
			return [];
		}

		// Transform to our CityData format
		const cities: CityData[] = data.data
			.filter((city) => {
				// Filter out invalid city entries
				return (
					city &&
					typeof city === "object" &&
					(city.city || city.name) &&
					city.latitude !== undefined &&
					city.longitude !== undefined
				);
			})
			.map((city) => ({
				id: city.id,
				name: city.city || city.name,
				country: city.country,
				countryCode: city.countryCode,
				region: city.region,
				latitude: city.latitude,
				longitude: city.longitude,
			}));

		// Cache the result (prune first to prevent unbounded growth)
		pruneCache();
		cache.set(cacheKey, { data: cities, timestamp: Date.now() });

		return cities;
	} catch (error) {
		console.error("Failed to search cities:", error);
		return [];
	}
}

/**
 * Get city details by ID
 */
export async function getCityById(
	cityId: number,
	signal?: AbortSignal,
): Promise<CityData | null> {
	const apiKey = process.env.NEXT_PUBLIC_GEODB_API_KEY;
	if (!apiKey) {
		return null;
	}

	try {
		const url = `${GEODB_BASE_URL}/places/${cityId}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"x-rapidapi-key": apiKey,
				"x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
			},
			signal,
		});

		if (!response.ok) {
			console.error("GeoDB API request failed:", response.statusText);
			return null;
		}

		const data = (await response.json()) as { data: GeoCityResponse };

		// Validate response structure
		if (!data || !data.data || typeof data.data !== "object") {
			console.error("Invalid GeoDB response structure:", data);
			return null;
		}

		const city = data.data;

		// Validate city data
		if (
			!city ||
			!(city.city || city.name) ||
			city.latitude === undefined ||
			city.longitude === undefined
		) {
			console.error("Invalid city data in response:", city);
			return null;
		}

		return {
			id: city.id,
			name: city.city || city.name,
			country: city.country,
			countryCode: city.countryCode,
			region: city.region,
			latitude: city.latitude,
			longitude: city.longitude,
		};
	} catch (error) {
		console.error("Failed to get city:", error);
		return null;
	}
}

/**
 * Use browser geolocation to find nearby cities
 */
export async function findNearestCity(
	latitude: number,
	longitude: number,
	radiusKm: number = 50,
	signal?: AbortSignal,
): Promise<CityData | null> {
	const apiKey = process.env.NEXT_PUBLIC_GEODB_API_KEY;
	if (!apiKey) {
		return null;
	}

	try {
		const params = new URLSearchParams({
			location: `${latitude}${longitude >= 0 ? "+" : ""}${longitude}`,
			radius: radiusKm.toString(),
			sort: "-population",
			limit: "1",
			types: "CITY",
		});

		const url = `${GEODB_BASE_URL}/places?${params.toString()}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"x-rapidapi-key": apiKey,
				"x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
			},
			signal,
		});

		if (!response.ok) {
			console.error("GeoDB API request failed:", response.statusText);
			return null;
		}

		const data = (await response.json()) as GeoDBResponse;

		// Validate response structure
		if (!data || !data.data || !Array.isArray(data.data)) {
			console.error("Invalid GeoDB response structure:", data);
			return null;
		}

		if (data.data.length === 0) {
			return null;
		}

		const city = data.data[0];

		// Validate city data
		if (
			!city ||
			!(city.city || city.name) ||
			city.latitude === undefined ||
			city.longitude === undefined
		) {
			console.error("Invalid city data in response:", city);
			return null;
		}

		return {
			id: city.id,
			name: city.city || city.name,
			country: city.country,
			countryCode: city.countryCode,
			region: city.region,
			latitude: city.latitude,
			longitude: city.longitude,
		};
	} catch (error) {
		console.error("Failed to find nearest city:", error);
		return null;
	}
}
