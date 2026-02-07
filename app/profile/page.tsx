"use client";

import AdUnit from "@/components/ad-unit";
import { ProfileForm } from "@/components/profile-form";
import grindersData from "@/data/grinders.json";
import machinesData from "@/data/machines.json";
import { useStoredProfile } from "@/lib/hooks/use-stored-profile";
import { saveProfile } from "@/lib/profile";
import type { GrinderData, MachineData, UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
	const router = useRouter();
	const currentProfile = useStoredProfile();
	const [saveError, setSaveError] = useState<string | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const handleSave = (profile: UserProfile) => {
		const success = saveProfile(profile);
		if (success) {
			router.push("/");
		} else {
			setSaveError(
				"Could not save profile. localStorage may not be available. The app will still work, but your settings won't persist.",
			);
			// Clear any existing timeout before setting a new one
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			// Still redirect after showing error
			timeoutRef.current = setTimeout(() => {
				router.push("/");
			}, 3000);
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

					{/* Error Message */}
					{saveError && (
						<div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
							<p className="text-red-200 text-sm">{saveError}</p>
						</div>
					)}
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
