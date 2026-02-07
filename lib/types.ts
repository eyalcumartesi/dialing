// Core type definitions for Dial espresso calculator

export type RoastLevel =
	| "light"
	| "medium-light"
	| "medium"
	| "medium-dark"
	| "dark";
export type ProcessMethod =
	| "washed"
	| "natural"
	| "honey"
	| "anaerobic"
	| "other";
export type BoilerType = "single" | "dual" | "thermoblock" | "thermocoil";
export type BurrType = "flat" | "conical";
export type SteppedOrStepless = "stepped" | "stepless";
export type BasketType = "pressurized" | "non-pressurized" | "precision";
export type TastePreference = "balanced" | "body" | "sweetness" | "bright";
export type Confidence = "high" | "medium" | "low";
export type BeanType = "single-origin" | "blend";
export type BlendProfile =
	| "classic"
	| "bright-fruity"
	| "balanced"
	| "dark-bold"
	| "unknown";
export type MachineType =
	| "e61"
	| "hx"
	| "saturated"
	| "lever-spring"
	| "lever-manual"
	| "other";

export interface Location {
	lat: number;
	lon: number;
	city: string;
	country: string;
}

export interface Machine {
	brand: string;
	model: string;
	machineType: MachineType;
	pumpPressureBars: number;
	boilerType: BoilerType;
	groupHeadSizeMm: number;
	hasPreInfusion: boolean;
	hasPID: boolean;
	waterDebitMlPerMin: number;
	warmupMinutes?: number; // Optional: for E61 machines
}

export interface Grinder {
	brand: string;
	model: string;
	burrType: BurrType;
	burrSizeMm: number;
	rpm: number; // Grinder motor RPM
	espressoRangeMin: number;
	espressoRangeMax: number;
	totalSettings: number;
	steppedOrStepless: SteppedOrStepless;
	micronPerStep?: number;
}

export interface Basket {
	type: BasketType;
	sizeMm: number;
	capacityMinG: number;
	capacityMaxG: number;
	isBottomless: boolean;
}

export interface UserProfile {
	name?: string;
	location: Location;
	machine: Machine;
	grinder: Grinder;
	basket: Basket;
}

export interface BeanInfo {
	beanType: BeanType;
	roastLevel: RoastLevel;
	processMethod: ProcessMethod;
	roastDateDaysAgo: number;
	// Single origin fields
	originId?: string; // ID from origins.json
	varietalId?: string; // ID from varietals.json
	// Blend fields
	blendProfile?: BlendProfile;
	dominantOriginId?: string; // ID from origins.json, applied at 50% strength
}

export interface BrewTargets {
	ratio: number; // e.g., 2 means 1:2
	brewTimeMinSec: number;
	brewTimeMaxSec: number;
	tastePreference: TastePreference;
}

export interface WeatherData {
	temperatureC: number;
	humidity: number;
}

export interface AlgorithmInput {
	profile: UserProfile;
	bean: BeanInfo;
	targets: BrewTargets;
	weather: WeatherData;
}

export interface Adjustment {
	factor: string;
	effect: string;
}

export interface Reasoning {
	doseReasoning: string;
	grindReasoning: string;
	adjustments: Adjustment[];
}

export interface AlgorithmOutput {
	recommendedDoseG: number;
	recommendedGrindSetting: number | { min: number; max: number };
	expectedYieldG: number;
	expectedBrewTimeSec: { min: number; max: number };
	recommendedTempC: number; // Recommended brewing temperature
	confidence: Confidence;
	tips: string[]; // Includes warnings for fresh/old beans, machine warmup, etc.
	reasoning: Reasoning;
}

// Equipment database types
export interface MachineData extends Machine {
	id: string;
}

export interface GrinderData extends Grinder {
	id: string;
}

// Coffee varietal types
export interface VarietalCharacteristics {
	beanDensity: string;
	beanSize: string;
	solubility: string;
	sugarContent: string;
}

export interface VarietalData {
	id: string;
	name: string;
	species: string;
	characteristics: VarietalCharacteristics;
	extractionModifier: number; // percentage adjustment to grind setting
	flavorProfile: string;
	notes: string;
}

// Coffee origin types
export interface OriginCharacteristics {
	typicalAltitude: string;
	altitudeRange: string;
	soilType: string;
	processingTradition: string;
	climateType: string;
}

export interface OriginData {
	id: string;
	country: string;
	region: string;
	subRegion?: string;
	characteristics: OriginCharacteristics;
	extractionModifier: number; // percentage adjustment to grind setting
	densityFactor: string;
	reasoning: string;
	commonVarietals: string[];
	flavorProfile: string;
}

// GeoDB City API types
export interface CityData {
	id: number;
	name: string;
	country: string;
	countryCode: string;
	region: string;
	latitude: number;
	longitude: number;
}

// Blend profile types
export interface BlendProfileData {
	id: BlendProfile;
	name: string;
	description: string;
	extractionModifier: number; // percentage adjustment to grind setting
	flavorNotes: string;
	commonComponents: string[];
}
