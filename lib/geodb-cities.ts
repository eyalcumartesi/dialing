import type { CityData } from "./types";

const GEODB_BASE_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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

// Simple in-memory cache
const cache = new Map<string, { data: CityData[]; timestamp: number }>();

/**
 * Search cities by name prefix using GeoDB Cities API
 * Free tier: 86,400 requests/day via RapidAPI
 */
export async function searchCities(
	namePrefix: string,
	limit: number = 10,
): Promise<CityData[]> {
	if (!namePrefix || namePrefix.length < 2) {
		return [];
	}

	// Check cache
	const cacheKey = `${namePrefix.toLowerCase()}-${limit}`;
	const cached = cache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
		return cached.data;
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

		const url = `${GEODB_BASE_URL}/places?${params.toString()}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"x-rapidapi-key": apiKey,
				"x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
			},
		});

		if (!response.ok) {
			console.error("GeoDB API request failed:", response.statusText);
			return [];
		}

		const data = (await response.json()) as GeoDBResponse;

		// Transform to our CityData format
		const cities: CityData[] = data.data.map((city) => ({
			id: city.id,
			name: city.city || city.name,
			country: city.country,
			countryCode: city.countryCode,
			region: city.region,
			latitude: city.latitude,
			longitude: city.longitude,
		}));

		// Cache the result
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
export async function getCityById(cityId: number): Promise<CityData | null> {
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
		});

		if (!response.ok) {
			console.error("GeoDB API request failed:", response.statusText);
			return null;
		}

		const data = (await response.json()) as { data: GeoCityResponse };
		const city = data.data;

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
		});

		if (!response.ok) {
			console.error("GeoDB API request failed:", response.statusText);
			return null;
		}

		const data = (await response.json()) as GeoDBResponse;

		if (data.data.length === 0) {
			return null;
		}

		const city = data.data[0];
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
