import type { UserProfile } from "./types";

const PROFILE_KEY = "dial_user_profile";

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
	try {
		const test = "__localStorage_test__";
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch {
		return false;
	}
}

/**
 * Save user profile to localStorage
 */
export function saveProfile(profile: UserProfile): boolean {
	if (!isLocalStorageAvailable()) {
		console.warn("localStorage is not available. Profile will not persist.");
		return false;
	}

	try {
		localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
		return true;
	} catch (error) {
		console.error("Failed to save profile:", error);
		return false;
	}
}

/**
 * Load user profile from localStorage
 */
export function loadProfile(): UserProfile | null {
	if (!isLocalStorageAvailable()) {
		return null;
	}

	try {
		const stored = localStorage.getItem(PROFILE_KEY);
		if (!stored) {
			return null;
		}

		const profile = JSON.parse(stored) as UserProfile;
		return profile;
	} catch (error) {
		console.error("Failed to load profile:", error);
		return null;
	}
}

/**
 * Clear user profile from localStorage
 */
export function clearProfile(): boolean {
	if (!isLocalStorageAvailable()) {
		return false;
	}

	try {
		localStorage.removeItem(PROFILE_KEY);
		return true;
	} catch (error) {
		console.error("Failed to clear profile:", error);
		return false;
	}
}

/**
 * Check if a profile exists
 */
export function hasProfile(): boolean {
	if (!isLocalStorageAvailable()) {
		return false;
	}

	try {
		return localStorage.getItem(PROFILE_KEY) !== null;
	} catch {
		return false;
	}
}
