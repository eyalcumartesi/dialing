# Espresso Dial-In Calculator — Claude Code Prompt

## Project Overview

Build a modern Next.js web app called **"Dial"** — an espresso dial-in calculator that recommends grind size and dose based on user inputs (bean info, equipment, environment). The algorithm is **deterministic and rules-based** (no AI inference). The UI should feel premium and coffee-forward — think specialty coffee brand meets data dashboard.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict mode, no `as` assertions)
- **Tailwind CSS v4**
- You write every component yourself. It takes slightly longer but the result is 100% yours, zero dependency lock-in, and you get exactly the coffee-instrument-panel aesthetic without fighting anyone's design system. For a 2-page app this is maybe 2-3 extra hours of work.
- **Framer Motion** for animations
- **OpenWeatherMap API** for weather data (free tier, current weather endpoint)
- No database — use `localStorage` for profile persistence (v1)
- No authentication (v1)

## Design Direction

**Aesthetic: "Specialty Coffee Meets Instrument Panel"**

- Dark theme with warm coffee tones — think deep espresso browns (#1a1209), warm cream (#f5e6d0), amber/copper accents (#c87941)
- Typography: Use a distinctive serif for headings (e.g., "Playfair Display" or "DM Serif Display") paired with a clean sans-serif body font (e.g., "DM Sans" or "Outfit")
- Generous whitespace, card-based layout with subtle grain/noise texture on backgrounds
- Smooth page transitions and micro-interactions (slider adjustments, result reveals)
- Mobile-first responsive design
- The result/recommendation should feel like a "recipe card" — the hero moment of the UI

## Core Features

### 1. User Profile (saved to localStorage)

The profile stores your "fixed" equipment setup so you don't re-enter it every time:

```typescript
interface UserProfile {
	name?: string;
	location: {
		lat: number;
		lon: number;
		city: string;
		country: string;
	};
	machine: {
		brand: string;
		model: string;
		// looked up from equipment DB:
		pumpPressureBars: number;
		boilerType: "single" | "dual" | "thermoblock" | "thermocoil";
		groupHeadSizeMm: number;
		hasPreInfusion: boolean;
		hasPID: boolean;
		waterDebitMlPerMin: number; // important for grind calc
	};
	grinder: {
		brand: string;
		model: string;
		// looked up from equipment DB:
		burrType: "flat" | "conical";
		burrSizeMm: number;
		espressoRangeMin: number; // setting number
		espressoRangeMax: number;
		totalSettings: number;
		steppedOrStepless: "stepped" | "stepless";
		micronPerStep?: number; // if stepped
	};
	basket: {
		type: "pressurized" | "non-pressurized" | "precision"; // precision = IMS/VST
		sizeMm: number; // 51, 54, 58
		capacityMinG: number;
		capacityMaxG: number;
		isBottomless: boolean;
	};
}
```

**Profile page/modal:** Let user select machine and grinder from dropdowns (populated from the JSON equipment database). Basket info is entered manually via a small form. Location is fetched via browser geolocation API with a "Detect my location" button, or entered manually.

### 2. Equipment Database (`/data/equipment.json`)

A JSON file with ~20 popular machines and ~15 popular grinders. Include at minimum:

**Machines:**

- DeLonghi Stilosa EC260 (15 bar, single boiler, 51mm, no PID, no pre-infusion, ~184 ml/min water debit)
- DeLonghi Dedica EC685 (15 bar, thermoblock, 51mm, no PID, no pre-infusion)
- Breville/Sage Bambino Plus (9 bar, thermocoil, 54mm, has pre-infusion, has PID)
- Breville/Sage Barista Express (15 bar, thermocoil, 54mm, has pre-infusion, has PID)
- Gaggia Classic Pro (15 bar, single boiler, 58mm, no PID by default, no pre-infusion)
- Rancilio Silvia (15 bar, single boiler, 58mm, no PID by default, no pre-infusion)
- Breville/Sage Dual Boiler (9 bar, dual boiler, 58mm, has pre-infusion, has PID)
- La Marzocco Linea Mini (9 bar, dual boiler, 58mm, has pre-infusion, has PID)
- Lelit Anna PL41TEM (15 bar, single boiler, 57mm, has PID, no pre-infusion)
- Flair Espresso Pro 2 (manual lever, no boiler, 46mm, manual pre-infusion, no PID)
- Cafelat Robot (manual lever, no boiler, 58mm, manual pre-infusion, no PID)
- Add 5-8 more popular entry-to-mid machines

**Grinders:**

- Baratza Encore ESP (conical, 40mm, settings 1-20 espresso range, stepped, ~20 microns/step)
- Baratza Sette 270 (conical, 40mm, 31 macro + micro settings, stepped)
- Breville/Sage Smart Grinder Pro (conical, 40mm, 60 settings, stepped)
- 1Zpresso JX-Pro (conical, 48mm, stepless for espresso)
- 1Zpresso J-Max (conical, 48mm, stepped, ~8.8 microns/click)
- Eureka Mignon Notte/Manuale (flat, 50mm, stepless)
- Eureka Mignon Specialita (flat, 55mm, stepless)
- Niche Zero (conical, 63mm, stepless)
- Comandante C40 (conical, hand, stepless-ish)
- DF64 (flat, 64mm, stepless)
- Fellow Opus (conical, 40mm, stepped)
- Turin SD40 / SK40 (flat, 40mm, stepped)
- Add a few more popular ones

### 3. Brew Input Form (the main page)

This is what the user fills in per brew session. It should be a clean, single-page form with these sections:

**Bean Information:**

- `roastLevel`: select → Light, Medium-Light, Medium, Medium-Dark, Dark
- `beanVarietal`: text input (optional, e.g., "Typica", "Bourbon", "Gesha")
- `processMethod`: select → Washed, Natural, Honey, Anaerobic, Other
- `roastDateDaysAgo`: number input or date picker → calculates days since roast automatically. Show a subtle indicator: "Fresh ✓" (7-21 days), "Peak ✓✓" (10-16 days), "Aging ⚠️" (21+ days), "Too fresh ⚠️" (< 5 days)
- `origin`: text input (optional, e.g., "Panama", "Ethiopia")

**Desired Output (what you want):**

- `targetRatio`: slider or preset buttons → 1:1.5, 1:2, 1:2.5, 1:3 (with labels: "Ristretto", "Standard", "Lungo-ish", "Lungo")
- `targetBrewTimeSec`: range slider → min 20s, max 40s, default 25-30s range
- `tastePreference`: select → Balanced, More Body/Intensity, More Sweetness/Clarity, Bright/Acidic

**Controllables (the algorithm outputs, but user can override):**

- `doseG`: number — **algorithm sets this** based on basket capacity, roast level, and bean density
- `grindSetting`: number or range — **algorithm sets this** based on all factors
- Both should show as prominent "result" values with an explanation of why

### 4. The Algorithm (`/lib/algorithm.ts`)

A pure function that takes all inputs and returns a recommendation. The logic should be transparent and well-commented. Here's the decision framework:

```typescript
interface AlgorithmInput {
	profile: UserProfile;
	bean: {
		roastLevel: "light" | "medium-light" | "medium" | "medium-dark" | "dark";
		processMethod: "washed" | "natural" | "honey" | "anaerobic" | "other";
		roastDateDaysAgo: number;
		origin?: string;
		varietal?: string;
	};
	targets: {
		ratio: number; // e.g., 2 means 1:2
		brewTimeMinSec: number;
		brewTimeMaxSec: number;
		tastePreference: "balanced" | "body" | "sweetness" | "bright";
	};
	weather: {
		temperatureC: number;
		humidity: number;
	};
}

interface AlgorithmOutput {
	recommendedDoseG: number;
	recommendedGrindSetting: number | { min: number; max: number }; // range for stepless
	expectedYieldG: number;
	expectedBrewTimeSec: { min: number; max: number };
	confidence: "high" | "medium" | "low"; // based on how much data we have
	tips: string[]; // contextual tips like "Your beans are very fresh, expect more CO2..."
	reasoning: {
		doseReasoning: string;
		grindReasoning: string;
		adjustments: { factor: string; effect: string }[]; // e.g., { factor: "High humidity (85%)", effect: "Grind 1 step coarser" }
	};
}
```

**Algorithm rules (implement these):**

**Base dose calculation:**

- Start with the basket's midpoint capacity: `(capacityMin + capacityMax) / 2`
- Dark roast → decrease dose by 0.5-1g (less dense, more volume per gram)
- Light roast → can dose higher by 0.5g (denser beans)
- Round to nearest 0.5g

**Base grind setting calculation:**

- Map the grinder's espresso range to a normalized 0-100 scale
- Start at the midpoint of the espresso range as the baseline
- Apply modifiers (each modifier shifts the normalized position, then map back to grinder settings):
  - **Roast level:** Dark → coarser (+8%), Light → finer (-8%), Medium is baseline
  - **Roast freshness:** Very fresh (<7 days) → slightly coarser (+3%), Stale (>28 days) → finer (-3%), Peak (10-21 days) is baseline
  - **Process method:** Natural → slightly coarser (+2%), Washed is baseline
  - **Machine pressure:** 15 bar machines → slightly coarser (+5%) vs 9 bar machines (baseline). The higher pressure pushes water through faster, so you need more resistance
  - **Machine water debit:** If significantly below average (< 250 ml/min like the Stilosa at 184), shift finer (-5%) because water passes slower
  - **Basket type:** Pressurized → much coarser (+20%), Non-pressurized is baseline, Precision (IMS/VST) → slightly finer (-3%)
  - **Weather - Humidity:** Above 70% → coarser (+2%), Below 30% → finer (-2%). Humidity affects how coffee absorbs moisture and swells
  - **Weather - Temperature:** Above 30°C → slightly coarser (+1%), Below 15°C → slightly finer (-1%). Ambient temp affects extraction temp
  - **Taste preference:** "body" → finer (-3%), "bright"/"sweetness" → coarser (+3%)
  - **Target ratio:** Longer ratio (>2.5) → slightly coarser (+2%), Shorter ratio (<1.8) → finer (-2%)
- Convert normalized position back to grinder's actual setting (integer for stepped, decimal for stepless)
- Clamp to grinder's min/max

**Yield calculation:**

- `yield = dose * ratio`

**Brew time estimation:**

- Based on the grind setting relative to the grinder's range, estimate if the resulting brew time falls within the user's target. If not, add a tip suggesting adjustment.

**Tips generation:**

- Generate 2-4 contextual tips based on the specific combination of inputs
- Examples:
  - "Your Stilosa runs at 15 bars with slow water debit — consider a cooling flush before brewing to manage temperature"
  - "At 2 weeks off roast, your beans are at peak. Great timing!"
  - "Humidity is high today (82%). Coffee grounds may absorb moisture and swell more — if your shot runs slow, try one step coarser"
  - "With a bottomless portafilter, use WDT (stir with a needle) to break up clumps from the Encore ESP"
  - "Natural process beans can be less soluble — if the shot tastes flat, try grinding finer"
  - "Light roasts need more energy to extract — consider a longer ratio (1:2.5) if the shot tastes sour"

### 5. Weather Integration

- Use OpenWeatherMap "Current Weather" API: `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric`
- Fetch on page load using the user's saved location
- Display current temp and humidity subtly in the UI (small weather badge)
- Pass temp and humidity into the algorithm
- Cache the weather for 30 minutes to avoid excessive API calls
- Use environment variable `NEXT_PUBLIC_OPENWEATHERMAP_API_KEY` (document this in README)
- If API fails or no key configured, gracefully degrade — algorithm works without weather, just skips those adjustments

### 6. Result Display

The output should be a beautiful "recipe card" that appears after clicking "Calculate" or updates live as inputs change. It should include:

- **Big, prominent numbers** for dose and grind setting — these are the hero values
- Expected yield and brew time range
- Confidence indicator
- Expandable "reasoning" section showing what factors influenced the recommendation and by how much
- The list of contextual tips
- A "Copy Recipe" button that copies a clean text summary to clipboard

### 7. Page Structure

```
/                  → Main calculator page (brew form + results)
/profile           → Equipment profile setup/edit
```

Keep it simple — just two pages. The main page should check if a profile exists and prompt to set one up if not (with a nice onboarding flow, not a hard redirect).

## File Structure

```
/app
  /page.tsx              → Main calculator page
  /profile/page.tsx      → Profile setup page
  /layout.tsx            → Root layout with fonts, metadata
  /globals.css           → Tailwind + custom CSS variables
/components
  /ui/                   → shadcn components
  /brew-form.tsx         → Bean + target inputs
  /result-card.tsx       → Recipe recommendation display
  /profile-form.tsx      → Equipment setup form
  /weather-badge.tsx     → Small weather display
  /equipment-select.tsx  → Searchable equipment dropdown
  /freshness-indicator.tsx → Roast date freshness badge
/lib
  /algorithm.ts          → Pure calculation function
  /weather.ts            → OpenWeatherMap fetch + cache
  /profile.ts            → localStorage read/write helpers
  /types.ts              → All TypeScript interfaces
/data
  /machines.json         → Machine database
  /grinders.json         → Grinder database
```

## Important Implementation Notes

1. **The algorithm must be a pure function** — no side effects, no API calls inside it. All data (weather, profile) is passed in as arguments. This makes it testable and predictable.

2. **Mobile-first** — many people will use this at their coffee station on their phone. The form should be easy to use with one hand. Use large touch targets.

3. **No over-engineering** — this is v1. No user accounts, no brew history tracking, no shot logging. Just: set up profile → input beans → get recommendation.

4. **localStorage profile** — save/load with proper error handling. If localStorage is unavailable, the app should still work (just won't persist).

5. **Env var for API key** — create a `.env.example` with `NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_key_here` and document in README how to get a free key.

6. **Equipment JSON should be well-structured and easy to extend** — someone should be able to add their machine by adding an entry to the JSON file.

7. **All grind setting outputs should be labeled with the grinder's actual setting system** — e.g., "Setting 11 on your Encore ESP" not just a raw number.

8. **The reasoning section is key** — users want to understand WHY. Show each factor and its directional effect clearly.
