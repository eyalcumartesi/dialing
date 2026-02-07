import blendsData from "@/data/blends.json";
import originsData from "@/data/origins.json";
import varietalsData from "@/data/varietals.json";
import type {
	Adjustment,
	AlgorithmInput,
	AlgorithmOutput,
	BlendProfileData,
	Confidence,
	OriginData,
	VarietalData,
} from "./types";

// === ALGORITHM CONSTANTS ===
/**
 * Fallback micron-per-step value when grinder doesn't specify.
 * Conservative estimate for grinders without calibration data.
 */
const FALLBACK_MICRON_PER_STEP = 10;

/**
 * Pure function to calculate espresso recipe recommendation
 * All inputs are passed as arguments - no side effects
 */
export function calculateRecipe(input: AlgorithmInput): AlgorithmOutput {
	// === INPUT VALIDATION ===
	// Validate basket capacity
	if (input.profile.basket.capacityMinG > input.profile.basket.capacityMaxG) {
		throw new Error(
			`Invalid basket capacity: min (${input.profile.basket.capacityMinG}g) > max (${input.profile.basket.capacityMaxG}g)`
		);
	}

	// Validate grinder range
	if (
		input.profile.grinder.espressoRangeMin >=
		input.profile.grinder.espressoRangeMax
	) {
		throw new Error(
			`Invalid grinder range: min (${input.profile.grinder.espressoRangeMin}) >= max (${input.profile.grinder.espressoRangeMax})`
		);
	}

	// Validate roast date
	if (input.bean.roastDateDaysAgo < 0) {
		throw new Error(
			`Invalid roast date: cannot be in the future (${input.bean.roastDateDaysAgo} days ago)`
		);
	}

	// Validate ratio
	if (input.targets.ratio <= 0 || !Number.isFinite(input.targets.ratio)) {
		throw new Error(`Invalid ratio: must be a positive number (got ${input.targets.ratio})`);
	}

	// Validate brew time range
	if (input.targets.brewTimeMinSec >= input.targets.brewTimeMaxSec) {
		throw new Error(
			`Invalid brew time range: min (${input.targets.brewTimeMinSec}s) >= max (${input.targets.brewTimeMaxSec}s)`
		);
	}

	const adjustments: Adjustment[] = [];

	// ========== DOSE CALCULATION ==========
	const { recommendedDoseG, doseReasoning } = calculateDose(input, adjustments);

	// ========== GRIND SETTING CALCULATION ==========
	const { recommendedGrindSetting, grindReasoning } = calculateGrindSetting(
		input,
		adjustments,
	);

	// ========== YIELD CALCULATION ==========
	const expectedYieldG =
		Math.round(recommendedDoseG * input.targets.ratio * 10) / 10;

	// ========== BREW TIME ESTIMATION ==========
	const expectedBrewTimeSec = estimateBrewTime(
		input,
		recommendedGrindSetting,
	);

	// ========== BREW TEMPERATURE ==========
	const recommendedTempC = calculateBrewTemp(input);

	// ========== CONFIDENCE ==========
	const confidence = calculateConfidence(input);

	// ========== TIPS GENERATION ==========
	const tips = generateTips(input, recommendedDoseG, adjustments);

	return {
		recommendedDoseG,
		recommendedGrindSetting,
		expectedYieldG,
		expectedBrewTimeSec,
		recommendedTempC,
		confidence,
		tips,
		reasoning: {
			doseReasoning,
			grindReasoning,
			adjustments,
		},
	};
}

// ============================================================
// DOSE
// ============================================================

function calculateDose(
	input: AlgorithmInput,
	adjustments: Adjustment[],
): { recommendedDoseG: number; doseReasoning: string } {
	const { basket } = input.profile;
	const { roastLevel } = input.bean;

	// Start with basket midpoint
	let dose = (basket.capacityMinG + basket.capacityMaxG) / 2;
	const baseDose = dose;

	// Adjust for roast level (density affects volume-to-weight)
	if (roastLevel === "dark") {
		dose -= 1;
		adjustments.push({
			factor: "Dark roast (significantly less dense)",
			effect: "Dose −1g",
		});
	} else if (roastLevel === "medium-dark") {
		dose -= 0.5;
		adjustments.push({
			factor: "Medium-dark roast (less dense)",
			effect: "Dose −0.5g",
		});
	} else if (roastLevel === "light") {
		dose += 0.5;
		adjustments.push({
			factor: "Light roast (denser beans)",
			effect: "Dose +0.5g",
		});
	}

	// Small basket compensation: 51mm baskets pack tighter,
	// slight bump helps build puck resistance
	if (basket.sizeMm <= 51 && basket.type !== "pressurized") {
		const bump = 0.5;
		if (dose + bump <= basket.capacityMaxG) {
			dose += bump;
			adjustments.push({
				factor: `Small ${basket.sizeMm}mm basket (non-pressurized)`,
				effect: `Dose +${bump}g to build puck resistance`,
			});
		}
	}

	// Round to nearest 0.5g
	dose = Math.round(dose * 2) / 2;

	// Clamp to basket capacity
	dose = Math.max(basket.capacityMinG, Math.min(basket.capacityMaxG, dose));

	const doseReasoning = `Basket midpoint: ${baseDose.toFixed(1)}g. Adjusted for roast density${basket.sizeMm <= 51 ? " and small basket size" : ""}. Final: ${dose}g.`;

	return { recommendedDoseG: dose, doseReasoning };
}

// ============================================================
// GRIND SETTING — Anchor-Point System
// ============================================================
//
// DESIGN RATIONALE:
//
// The old algorithm started at the midpoint of the grinder's espresso range
// and applied small % nudges. This is fundamentally wrong because:
//
// 1) The "espresso range" of most grinders is NOT centered on good espresso.
//    The Encore ESP has settings 1-20 for espresso, but real-world users
//    dial in between 3-8 for most beans with non-pressurized baskets.
//    Midpoint (10.5) is WAY too coarse — that's barely espresso territory.
//
// 2) Percentage-based modifiers on a 0-100 normalized scale produce tiny
//    adjustments that can't overcome a bad baseline. A ±5% shift on a
//    20-step range is ±1 step — meaningless when you're 7 steps off.
//
// NEW APPROACH: Anchor at ~25-30% of the espresso range (the "fine espresso
// zone"), then apply modifiers as ABSOLUTE grind steps, not percentages.
// Each modifier is expressed in microns of particle size change, then
// converted to the grinder's step size. This makes adjustments physically
// meaningful and consistent across different grinders.
//
// Calibration data point: Eyal's setup (Encore ESP + Stilosa + 51mm
// bottomless + Typica/Catuai washed medium ~14 days) → setting 4 works.
// Algorithm should land near 4-5 for this input.

/**
 * Convert a micron adjustment to grind steps for the given grinder.
 * Positive microns = coarser. Negative = finer.
 */
function micronsToSteps(
	microns: number,
	grinder: AlgorithmInput["profile"]["grinder"],
): number {
	// Validate inputs to prevent NaN propagation
	if (!Number.isFinite(microns)) {
		console.warn(`Invalid microns value: ${microns}, returning 0`);
		return 0;
	}

	if (grinder.micronPerStep && grinder.micronPerStep > 0) {
		return microns / grinder.micronPerStep;
	}
	// Fallback: estimate from range size. Assume the espresso range spans
	// roughly 200-400 microns total (typical for most grinders).
	const rangeSteps = grinder.espressoRangeMax - grinder.espressoRangeMin;

	// Guard against invalid grinder range (division by zero)
	if (rangeSteps <= 0) {
		console.warn(
			`Invalid grinder range for ${grinder.brand} ${grinder.model}: min=${grinder.espressoRangeMin}, max=${grinder.espressoRangeMax}. Using fallback.`
		);
		return microns / FALLBACK_MICRON_PER_STEP;
	}

	const estimatedTotalMicrons = rangeSteps > 30 ? 400 : 300;
	const estimatedMicronPerStep = estimatedTotalMicrons / rangeSteps;
	return microns / estimatedMicronPerStep;
}

function calculateGrindSetting(
	input: AlgorithmInput,
	adjustments: Adjustment[],
): {
	recommendedGrindSetting: number | { min: number; max: number };
	grindReasoning: string;
} {
	const { grinder, machine, basket } = input.profile;
	const {
		beanType,
		roastLevel,
		processMethod,
		roastDateDaysAgo,
		varietalId,
		originId,
		blendProfile,
		dominantOriginId,
	} = input.bean;
	const { ratio, tastePreference } = input.targets;
	const { temperatureC, humidity } = input.weather;

	const rangeSize = grinder.espressoRangeMax - grinder.espressoRangeMin;

	// ---------------------------------------------------------------
	// ANCHOR POINT: Start at 25% into the espresso range.
	// This puts us in the "fine espresso zone" — where most medium-roast,
	// washed, non-pressurized shots actually land.
	//
	// For Encore ESP (1-20): 1 + 0.25 × 19 = 5.75 → ~6
	// For Sette 270 (1-15): 1 + 0.25 × 14 = 4.5
	// For Niche Zero (0-25): 0 + 0.25 × 25 = 6.25
	// For stepless Eureka (0-5): 0 + 0.25 × 5 = 1.25
	// ---------------------------------------------------------------
	let setting = grinder.espressoRangeMin + rangeSize * 0.25;

	adjustments.push({
		factor: "Baseline (fine espresso zone)",
		effect: `Starting at setting ${setting.toFixed(1)} (25% of espresso range)`,
	});

	// ---------------------------------------------------------------
	// MODIFIERS — expressed in microns, then converted to steps.
	// Positive microns = coarser (higher setting number).
	// Negative microns = finer (lower setting number).
	//
	// Reference: one Encore ESP step ≈ 20 microns.
	// A "1 step" adjustment on an Encore ESP = 20 microns.
	// ---------------------------------------------------------------

	// === Roast Level (biggest single factor after baseline) ===
	// Ultra-dark beans are porous and extract fast → need much coarser.
	// Light beans are dense and resist extraction → need finer.
	const roastMicrons: Record<string, number> = {
		light: -40, // ~2 steps finer on Encore ESP
		"medium-light": -20, // ~1 step finer
		medium: 0, // baseline
		"medium-dark": 40, // ~2 steps coarser
		dark: 80, // ~4 steps coarser
	};
	const roastShift = roastMicrons[roastLevel] ?? 0;
	if (roastShift !== 0) {
		const steps = micronsToSteps(roastShift, grinder);
		setting += steps;
		adjustments.push({
			factor: `${roastLevel} roast`,
			effect: `${roastShift > 0 ? "Coarser" : "Finer"} by ~${Math.abs(steps).toFixed(1)} steps (${roastShift > 0 ? "+" : ""}${roastShift}μm)`,
		});
	}

	// === Degassing / Freshness (curve-based, not linear) ===
	// Research shows espresso peaks at 7-14 days post-roast (light roasts up to 14 days)
	// Days 1-4:  Aggressive degassing → CO2 disrupts flow → grind coarser
	// Days 5-6:  Still degassing but calming → slight coarser
	// Days 7-14: Peak window → baseline (no adjustment)
	// Days 15-35: Starting to stale → finer to compensate
	// Days 35+:  Stale → noticeably finer
	let freshnessMicrons = 0;
	let freshnessLabel = "";
	if (roastDateDaysAgo <= 4) {
		freshnessMicrons = 60; // ~3 steps coarser on Encore
		freshnessLabel = `Very fresh (${roastDateDaysAgo}d) — heavy CO2 disrupts extraction`;
	} else if (roastDateDaysAgo <= 6) {
		freshnessMicrons = 30;
		freshnessLabel = `Fresh (${roastDateDaysAgo}d) — still degassing`;
	} else if (roastDateDaysAgo <= 14) {
		freshnessMicrons = 0;
		freshnessLabel = ""; // Peak — no adjustment
	} else if (roastDateDaysAgo <= 35) {
		freshnessMicrons = -20;
		freshnessLabel = `Aging (${roastDateDaysAgo}d) — less CO2, grind finer`;
	} else {
		freshnessMicrons = -40;
		freshnessLabel = `Stale (${roastDateDaysAgo}d) — grind finer to extract remaining flavor`;
	}

	// Natural process beans degas ~20% faster
	if (processMethod === "natural" && roastDateDaysAgo <= 6) {
		const adjusted = Math.round(freshnessMicrons * 0.8);
		// Guard against NaN propagation
		if (Number.isFinite(adjusted)) {
			freshnessMicrons = adjusted;
			freshnessLabel += " (natural process degasses faster)";
		}
	}

	if (freshnessMicrons !== 0 && Number.isFinite(freshnessMicrons)) {
		const steps = micronsToSteps(freshnessMicrons, grinder);
		// Additional NaN guard for the steps calculation
		if (Number.isFinite(steps)) {
			setting += steps;
			adjustments.push({
				factor: freshnessLabel,
				effect: `${freshnessMicrons > 0 ? "Coarser" : "Finer"} by ~${Math.abs(steps).toFixed(1)} steps`,
			});
		}
	}

	// === Process Method ===
	const processMicrons: Record<string, number> = {
		washed: 0,
		natural: 20, // Less soluble, slightly coarser
		honey: 10, // Between washed and natural
		anaerobic: -10, // Often more soluble from extended fermentation
		other: 0,
	};
	const processShift = processMicrons[processMethod] ?? 0;
	if (processShift !== 0) {
		const steps = micronsToSteps(processShift, grinder);
		setting += steps;
		adjustments.push({
			factor: `${processMethod} process`,
			effect: `${processShift > 0 ? "Coarser" : "Finer"} by ~${Math.abs(steps).toFixed(1)} steps`,
		});
	}

	// === Varietal (Single Origin) or Blend Profile ===
	if (beanType === "single-origin") {
		if (varietalId) {
			const varietal = (varietalsData as VarietalData[]).find(
				(v) => v.id === varietalId,
			);
			if (varietal && varietal.extractionModifier !== 0) {
				// extractionModifier is roughly in "percentage points" from the old system.
				// Convert: each point ≈ 10 microns of adjustment.
				const microns = varietal.extractionModifier * 10;
				const steps = micronsToSteps(microns, grinder);
				setting += steps;
				adjustments.push({
					factor: `${varietal.name} varietal (${varietal.characteristics.beanDensity} density, ${varietal.characteristics.solubility} solubility)`,
					effect: `${microns > 0 ? "Coarser" : "Finer"} by ~${Math.abs(steps).toFixed(1)} steps`,
				});
			}
		}

		if (originId) {
			const origin = (originsData as OriginData[]).find(
				(o) => o.id === originId,
			);
			if (origin && origin.extractionModifier !== 0) {
				const microns = origin.extractionModifier * 10;
				const steps = micronsToSteps(microns, grinder);
				setting += steps;
				adjustments.push({
					factor: `${origin.country} origin (${origin.characteristics.altitudeRange}, ${origin.densityFactor} density)`,
					effect: `${microns > 0 ? "Coarser" : "Finer"} by ~${Math.abs(steps).toFixed(1)} steps`,
				});
			}
		}
	} else {
		// Blend
		if (blendProfile) {
			const blend = (blendsData as BlendProfileData[]).find(
				(b) => b.id === blendProfile,
			);
			if (blend && blend.extractionModifier !== 0) {
				const microns = blend.extractionModifier * 10;
				const steps = micronsToSteps(microns, grinder);
				setting += steps;
				adjustments.push({
					factor: `${blend.name} blend profile`,
					effect: `${microns > 0 ? "Coarser" : "Finer"} by ~${Math.abs(steps).toFixed(1)} steps`,
				});
			}
		}

		if (dominantOriginId) {
			const origin = (originsData as OriginData[]).find(
				(o) => o.id === dominantOriginId,
			);
			if (origin && origin.extractionModifier !== 0) {
				// 50% strength for blend's dominant origin
				const microns = origin.extractionModifier * 10 * 0.5;
				const steps = micronsToSteps(microns, grinder);
				setting += steps;
				adjustments.push({
					factor: `${origin.country} dominant origin (50% blend strength)`,
					effect: `${microns > 0 ? "Coarser" : "Finer"} by ~${Math.abs(steps).toFixed(1)} steps`,
				});
			}
		}
	}

	// === Machine Pressure ===
	// 15-bar machines push water harder → need MORE puck resistance → grind FINER.
	// This is counterintuitive but correct: higher pressure means faster flow
	// through the same grind, so you need finer grind to slow it down.
	// The old algorithm had this BACKWARDS (was going coarser for 15 bar).
	if (machine.pumpPressureBars >= 15) {
		const microns = -40; // ~2 steps finer on Encore
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `High pressure (${machine.pumpPressureBars} bar)`,
			effect: `Finer by ~${Math.abs(steps).toFixed(1)} steps — more pressure needs more puck resistance`,
		});
	}
	// Lever machines with manual pressure: slight coarser
	if (
		machine.machineType === "lever-manual" ||
		machine.machineType === "lever-spring"
	) {
		const microns = 30;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `Lever machine (variable pressure profile)`,
			effect: `Coarser by ~${Math.abs(steps).toFixed(1)} steps`,
		});
	}

	// === Machine Water Debit ===
	// Low debit = water passes slower = effectively lower flow rate.
	// This means the grind doesn't need to be as fine to achieve target brew time.
	// However, the Stilosa's low debit combined with 15 bar creates a unique
	// situation — the pressure is high but flow is restricted by the pump.
	// Net effect: slight finer still helps, but less than the pressure alone suggests.
	if (machine.waterDebitMlPerMin > 0 && machine.waterDebitMlPerMin < 220) {
		const microns = 20; // Partial offset — slow debit means less flow, so slightly coarser
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `Slow water debit (${machine.waterDebitMlPerMin} ml/min)`,
			effect: `Coarser by ~${Math.abs(steps).toFixed(1)} steps — slower flow compensates`,
		});
	}

	// === Basket Type ===
	if (basket.type === "pressurized") {
		// Pressurized baskets create backpressure artificially.
		// Grind can be MUCH coarser — almost filter territory.
		const microns = 160; // ~8 steps coarser on Encore
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: "Pressurized basket",
			effect: `Much coarser by ~${Math.abs(steps).toFixed(1)} steps — basket creates its own resistance`,
		});
	} else if (basket.type === "precision") {
		// IMS/VST precision baskets have uniform holes → more even extraction
		// → can grind slightly finer without channeling
		const microns = -10;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: "Precision basket (IMS/VST)",
			effect: `Finer by ~${Math.abs(steps).toFixed(1)} steps — uniform holes reduce channeling`,
		});
	}

	// === Basket Size ===
	// Smaller baskets (51mm) have less surface area = less puck resistance
	// compared to 58mm. Needs slightly finer to compensate.
	if (basket.sizeMm <= 51 && basket.type !== "pressurized") {
		const microns = -20;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `Small ${basket.sizeMm}mm basket`,
			effect: `Finer by ~${Math.abs(steps).toFixed(1)} steps — less puck area needs finer grind`,
		});
	}

	// === Humidity ===
	if (humidity > 70) {
		const microns = 15;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `High humidity (${humidity}%)`,
			effect: `Coarser by ~${Math.abs(steps).toFixed(1)} steps — grounds absorb moisture`,
		});
	} else if (humidity < 30) {
		const microns = -15;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `Low humidity (${humidity}%)`,
			effect: `Finer by ~${Math.abs(steps).toFixed(1)} steps — dry grounds, less swelling`,
		});
	}

	// === Ambient Temperature ===
	if (temperatureC > 30) {
		const microns = 10;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `High ambient temp (${temperatureC}°C)`,
			effect: `Coarser by ~${Math.abs(steps).toFixed(1)} steps`,
		});
	} else if (temperatureC < 15) {
		const microns = -10;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `Low ambient temp (${temperatureC}°C)`,
			effect: `Finer by ~${Math.abs(steps).toFixed(1)} steps`,
		});
	}

	// === Taste Preference ===
	if (tastePreference === "body") {
		const microns = -20;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: "Preference: more body",
			effect: `Finer by ~${Math.abs(steps).toFixed(1)} steps — higher extraction`,
		});
	} else if (tastePreference === "bright" || tastePreference === "sweetness") {
		const microns = 20;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `Preference: ${tastePreference}`,
			effect: `Coarser by ~${Math.abs(steps).toFixed(1)} steps — avoid over-extraction`,
		});
	}

	// === Target Ratio ===
	if (ratio > 2.5) {
		const microns = 20;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `Long ratio (1:${ratio})`,
			effect: `Coarser by ~${Math.abs(steps).toFixed(1)} steps — more water, less resistance needed`,
		});
	} else if (ratio < 1.8) {
		const microns = -20;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `Short ratio (1:${ratio})`,
			effect: `Finer by ~${Math.abs(steps).toFixed(1)} steps — ristretto needs more resistance`,
		});
	}

	// === Grinder RPM (heat + fines generation) ===
	if (grinder.rpm > 1200) {
		// High RPM grinders generate more heat and fines, which effectively
		// makes the grind act finer than the setting suggests → go slightly coarser
		const microns = 10;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: `High RPM grinder (~${grinder.rpm} RPM)`,
			effect: `Coarser by ~${Math.abs(steps).toFixed(1)} steps — heat/fines compensate`,
		});
	}

	// === Interaction Terms ===
	// Compound effects where multiple factors amplify each other

	// Fresh + Dark + Hot = compounds fast extraction risk
	if (
		roastDateDaysAgo < 7 &&
		(roastLevel === "dark" || roastLevel === "medium-dark") &&
		temperatureC > 28
	) {
		const microns = 20;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: "⚠ Compound: fresh + dark + warm conditions",
			effect: `Extra coarser by ~${Math.abs(steps).toFixed(1)} steps — high channeling risk`,
		});
	}

	// High humidity + already fine = clumping warning (handled in tips, but also nudge coarser)
	if (humidity > 65 && setting < grinder.espressoRangeMin + rangeSize * 0.15) {
		const microns = 10;
		const steps = micronsToSteps(microns, grinder);
		setting += steps;
		adjustments.push({
			factor: "⚠ Compound: high humidity + very fine grind",
			effect: `Extra coarser by ~${Math.abs(steps).toFixed(1)} steps — clumping risk`,
		});
	}

	// ---------------------------------------------------------------
	// CLAMP & FORMAT
	// ---------------------------------------------------------------
	setting = Math.max(
		grinder.espressoRangeMin,
		Math.min(grinder.espressoRangeMax, setting),
	);

	let recommendedGrindSetting: number | { min: number; max: number };

	if (grinder.steppedOrStepless === "stepped") {
		recommendedGrindSetting = Math.round(setting);
		// Ensure at least min
		recommendedGrindSetting = Math.max(
			grinder.espressoRangeMin,
			recommendedGrindSetting,
		);
	} else {
		// For stepless, provide a ±0.5 range
		recommendedGrindSetting = {
			min: Math.max(
				grinder.espressoRangeMin,
				Math.round((setting - 0.5) * 10) / 10,
			),
			max: Math.min(
				grinder.espressoRangeMax,
				Math.round((setting + 0.5) * 10) / 10,
			),
		};
	}

	const settingDisplay =
		typeof recommendedGrindSetting === "number"
			? `setting ${recommendedGrindSetting}`
			: `range ${recommendedGrindSetting.min.toFixed(1)}–${recommendedGrindSetting.max.toFixed(1)}`;

	const grindReasoning = `Started at the fine espresso zone (25% of ${grinder.brand} ${grinder.model}'s range = ${(grinder.espressoRangeMin + rangeSize * 0.25).toFixed(1)}). Applied ${adjustments.length - 1} adjustments in microns, converted to grind steps. Recommended: ${settingDisplay}.`;

	return { recommendedGrindSetting, grindReasoning };
}

// ============================================================
// BREW TIME ESTIMATION
// ============================================================

function estimateBrewTime(
	input: AlgorithmInput,
	grindSetting: number | { min: number; max: number },
): { min: number; max: number } {
	const { grinder } = input.profile;
	const { ratio } = input.targets;
	const { brewTimeMinSec, brewTimeMaxSec } = input.targets;

	// Get the actual grind setting as a number (use midpoint for stepless)
	const actualSetting =
		typeof grindSetting === "number"
			? grindSetting
			: (grindSetting.min + grindSetting.max) / 2;

	// Calculate where this setting sits in the grinder's espresso range (0-100%)
	const rangeSize = grinder.espressoRangeMax - grinder.espressoRangeMin;
	const positionInRange =
		(actualSetting - grinder.espressoRangeMin) / rangeSize;

	// Finer grind (lower setting) = slower flow = longer time
	// Coarser grind (higher setting) = faster flow = shorter time
	let timeAdjustmentSec = 0;

	if (positionInRange < 0.4) {
		// Very fine grind → add 3-7 seconds
		timeAdjustmentSec = 3 + (0.4 - positionInRange) * 10;
	} else if (positionInRange > 0.6) {
		// Coarse grind → subtract 3-7 seconds
		timeAdjustmentSec = -3 - (positionInRange - 0.6) * 10;
	}
	// Middle range (0.4-0.6) → no adjustment

	// Additional adjustment for ratio:
	// Ristretto (<1.8) extracts faster (less volume)
	// Lungo (>2.5) takes longer (more volume)
	if (ratio < 1.8) {
		timeAdjustmentSec -= 3;
	} else if (ratio > 2.5) {
		timeAdjustmentSec += 5;
	}

	// Apply adjustment to user's target range
	const estimatedMin = Math.round(
		Math.max(15, brewTimeMinSec + timeAdjustmentSec),
	);
	const estimatedMax = Math.round(
		Math.max(20, brewTimeMaxSec + timeAdjustmentSec),
	);

	return {
		min: Math.min(estimatedMin, estimatedMax),
		max: Math.max(estimatedMin, estimatedMax),
	};
}

// ============================================================
// BREW TEMPERATURE
// ============================================================

function calculateBrewTemp(input: AlgorithmInput): number {
	const { roastLevel } = input.bean;

	// Base temperatures by roast level
	const tempMap: Record<string, number> = {
		light: 95,
		"medium-light": 94,
		medium: 93,
		"medium-dark": 91,
		dark: 89,
	};

	let temp = tempMap[roastLevel] ?? 93;

	// Anaerobic / fermented beans: slightly lower to avoid harsh fermentation flavors
	if (input.bean.processMethod === "anaerobic") {
		temp -= 1;
	}

	return temp;
}

// ============================================================
// CONFIDENCE
// ============================================================

function calculateConfidence(input: AlgorithmInput): Confidence {
	const { machine, grinder } = input.profile;
	const { beanType, blendProfile, roastDateDaysAgo } = input.bean;

	let score = 70; // Base confidence

	// Known equipment with good specs = more predictable
	if (machine.hasPID) score += 8;
	if (machine.hasPreInfusion) score += 5;
	if (grinder.burrSizeMm >= 50) score += 5;
	if (grinder.micronPerStep && grinder.micronPerStep <= 15) score += 5;

	// Unknown blend = less confident
	if (beanType === "blend" && blendProfile === "unknown") score -= 15;

	// Very fresh or very stale = less predictable
	if (roastDateDaysAgo < 5) score -= 10;
	if (roastDateDaysAgo > 35) score -= 8;

	// High pressure without PID = temperature instability
	if (machine.pumpPressureBars >= 15 && !machine.hasPID) score -= 8;

	// Pressurized basket = more forgiving but less precise
	if (input.profile.basket.type === "pressurized") score -= 5;

	if (score >= 75) return "high";
	if (score >= 55) return "medium";
	return "low";
}

// ============================================================
// TIPS
// ============================================================

function generateTips(
	input: AlgorithmInput,
	doseG: number,
	adjustments: Adjustment[],
): string[] {
	const tips: string[] = [];
	const { machine, grinder, basket } = input.profile;
	const {
		roastDateDaysAgo,
		roastLevel,
		processMethod,
		beanType,
		blendProfile,
	} = input.bean;
	const { humidity, temperatureC } = input.weather;

	// === Channeling risk warning ===
	const channelingRisks: string[] = [];
	if (roastDateDaysAgo < 5) channelingRisks.push("very fresh beans (CO2)");
	if (humidity > 65) channelingRisks.push("high humidity (clumping)");
	if (grinder.burrType === "conical" && grinder.burrSizeMm < 50)
		channelingRisks.push("small conical burrs (fines)");
	if (!basket.isBottomless && basket.type === "non-pressurized") {
		// Can't see channeling without bottomless — worth noting
	}
	if (channelingRisks.length >= 2) {
		tips.push(
			`⚠ High channeling risk: ${channelingRisks.join(", ")}. Use WDT (stir with a thin needle) and tamp evenly.`,
		);
	}

	// === Blend tips ===
	if (beanType === "blend" && blendProfile === "unknown") {
		tips.push(
			"Using neutral settings for unknown blend. Check your bag for roast info — selecting a blend profile will improve accuracy.",
		);
	}

	// === Freshness tips ===
	if (roastDateDaysAgo <= 4) {
		tips.push(
			`Beans are ${roastDateDaysAgo} days off roast — still degassing heavily. Expect inconsistent shots. Consider waiting until day 7+.`,
		);
	} else if (roastDateDaysAgo >= 7 && roastDateDaysAgo <= 14) {
		tips.push(
			`Beans are at peak freshness (${roastDateDaysAgo} days). Great timing for espresso!`,
		);
	} else if (roastDateDaysAgo > 28) {
		tips.push(
			`Beans are ${roastDateDaysAgo} days off roast — flavors will be muted. Grinding finer helps extract remaining character.`,
		);
	}

	// === Machine-specific tips ===
	if (machine.pumpPressureBars >= 15 && !machine.hasPID) {
		tips.push(
			"Your machine runs at high pressure without PID. Do a cooling flush (run water briefly) before pulling to stabilize temperature.",
		);
	}

	if (machine.machineType === "hx") {
		tips.push(
			"HX machine: flush 2-3 seconds before brewing to clear superheated water from the group.",
		);
	}

	if (machine.machineType === "e61" && machine.warmupMinutes) {
		tips.push(
			`E61 group head needs ${machine.warmupMinutes}+ minutes to fully heat. Pull a blank shot through to warm the portafilter.`,
		);
	}

	// === Grinder tips ===
	if (
		basket.isBottomless &&
		grinder.burrType === "conical" &&
		grinder.burrSizeMm < 50
	) {
		tips.push(
			"Small conical burrs + bottomless portafilter: WDT is essential. Stir grounds with a thin needle before tamping.",
		);
	}

	// === Roast-specific tips ===
	if (roastLevel === "light") {
		tips.push(
			"Light roast: if the shot tastes sour/thin, try grinding 1-2 steps finer or extending the ratio to 1:2.5.",
		);
	} else if (roastLevel === "dark") {
		tips.push(
			"Dark roast: if the shot tastes bitter/ashy, try grinding 1-2 steps coarser or shortening ratio to 1:1.5.",
		);
	}

	// === Weather tips ===
	if (humidity > 70) {
		tips.push(
			`Humidity is ${humidity}% — grounds may clump. If the shot chokes, try 1 step coarser.`,
		);
	} else if (humidity < 30) {
		tips.push(
			`Humidity is ${humidity}% — static may cause grounds to scatter. Try RDT: spritz beans lightly with water before grinding.`,
		);
	}

	// === Temperature recommendation context ===
	if (!machine.hasPID) {
		tips.push(
			"Your machine lacks PID temperature control. The brew temp recommendation is ideal — approximate it with warm-up time and cooling flushes.",
		);
	}

	// === Basket tips ===
	if (basket.type === "pressurized") {
		tips.push(
			"Pressurized baskets are forgiving but limit flavor clarity. Consider upgrading to a non-pressurized basket when you're comfortable with your grind consistency.",
		);
	}

	// Return max 4 most relevant tips
	return tips.slice(0, 4);
}
