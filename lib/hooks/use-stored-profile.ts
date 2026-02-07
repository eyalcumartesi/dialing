import { hasProfile, loadProfile } from "@/lib/profile";
import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Hook to read profile from localStorage using useSyncExternalStore
 * Handles both cross-window (storage event) and same-window (custom event) changes
 * Returns null if no profile exists, otherwise returns the loaded UserProfile
 */
export function useStoredProfile() {
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
		const currentJson =
			typeof window !== "undefined"
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
