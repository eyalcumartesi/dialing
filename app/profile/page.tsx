"use client";

import AdUnit from "@/components/ad-unit";
import { ProfileForm } from "@/components/profile-form";
import grindersData from "@/data/grinders.json";
import machinesData from "@/data/machines.json";
import { loadProfile, saveProfile } from "@/lib/profile";
import type { GrinderData, MachineData, UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useSyncExternalStore } from "react";

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

export default function ProfilePage() {
	const router = useRouter();
	const currentProfile = useStoredProfile();

	const handleSave = (profile: UserProfile) => {
		const success = saveProfile(profile);
		if (success) {
			router.push("/");
		} else {
			alert(
				"Could not save profile. localStorage may not be available. The app will still work, but your settings won't persist.",
			);
			router.push("/");
		}
	};

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl md:text-5xl font-bold text-amber mb-2">
						Equipment Profile
					</h1>
					<p className="text-cream-dark">
						Set up your espresso equipment once. We&apos;ll use this to
						calculate your recipes.
					</p>
				</div>

				{/* Form */}
				<div className="bg-coffee-dark border border-coffee-medium rounded-xl p-6 md:p-8">
					<ProfileForm
						machines={machinesData as MachineData[]}
						grinders={grindersData as GrinderData[]}
						initialProfile={currentProfile}
						onSave={handleSave}
					/>
				</div>

				{/* Ad Banner */}
				<div className="mt-8">
					<AdUnit slot="profile-banner" format="auto" responsive={true} />
				</div>

				{/* Back Link */}
				<div className="mt-6 text-center">
					<button
						onClick={() => router.push("/")}
						className="text-cream-dark hover:text-cream transition-colors"
					>
						← Back to calculator
					</button>
				</div>
			</div>
		</div>
	);
}
