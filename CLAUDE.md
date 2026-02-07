# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dial** is a deterministic espresso recipe calculator built with Next.js. It recommends precise dose and grind settings based on user equipment, beans, and environmental conditions using a rules-based algorithm (no ML/AI). All data is stored locally in the browser via localStorage.

Key features:
- Equipment database with 20+ espresso machines and 18+ grinders
- Weather integration for humidity/temperature adjustments
- Real-time recipe calculations with transparent reasoning
- Mobile-first UI with dark coffee theme

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Production server (after build)
pnpm start

# Linting
pnpm lint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Data Storage**: Browser localStorage (no backend)
- **Optional APIs**: OpenWeatherMap (weather), GeoDB Cities (city search)

## Architecture

### Core Algorithm (`lib/algorithm.ts`)

The heart of the application is a pure, deterministic function `calculateRecipe()` that takes equipment, beans, targets, and weather as input and returns dose, grind setting, and tips.

**Key design principles:**
- **Anchor-point grind system**: Starts at 25% of grinder's espresso range (the "fine espresso zone"), NOT the midpoint. This is critical — most grinders' espresso ranges are not centered on good espresso.
- **Micron-based adjustments**: All grind modifiers are expressed in microns of particle size, then converted to grinder-specific steps using `micronsToSteps()`. This makes adjustments physically meaningful and consistent across grinders.
- **Calibration reference**: Eyal's setup (Encore ESP + Stilosa + 51mm bottomless + washed medium ~14 days) → setting 4 works. Algorithm should land near 4-5 for this input.

**Major adjustment factors (in order of impact):**
1. Roast level (±80 microns for dark, -40 for light)
2. Bean freshness (curve-based: +60 microns days 1-4, 0 at peak 7-21, -40 for stale 35+)
3. Basket type (pressurized: +160 microns)
4. Machine pressure (15 bar: -40 microns — FINER because higher pressure needs more resistance)
5. Process method, varietal/origin characteristics, humidity, temperature, taste preference, ratio

**Important interaction terms:**
- Fresh + dark + hot compounds fast extraction risk → extra coarser
- High humidity + very fine grind → clumping risk → extra coarser

### Data Flow

1. **Profile Setup** (`app/profile/page.tsx`): User configures equipment once
   - Machine, grinder, basket specs selected from JSON databases
   - Location for weather data (auto-detected or manual)
   - Saved to localStorage via `lib/profile.ts`

2. **Recipe Calculation** (`app/page.tsx`): User enters bean info per session
   - Bean type, roast level, process method, roast date
   - Origin/varietal (single origin) or blend profile
   - Brew targets (ratio, time, taste preference)
   - Weather fetched from OpenWeatherMap API (cached 30min) or defaults used
   - `calculateRecipe()` runs client-side, returns full recommendation + reasoning

3. **Result Display** (`components/result-card.tsx`): Shows dose, grind, yield, temp, EY, tips

### File Structure

```
/app                          → Next.js App Router pages
  page.tsx                    → Main calculator (bean form + results)
  profile/page.tsx            → Equipment setup
  layout.tsx                  → Root layout with metadata
  globals.css                 → Tailwind + custom styles

/components                   → React components
  brew-form.tsx               → Bean info input form
  result-card.tsx             → Recipe display with reasoning
  profile-form.tsx            → Equipment setup form
  equipment-select.tsx        → Searchable dropdowns for machines/grinders
  city-search.tsx             → City autocomplete (GeoDB API)
  weather-badge.tsx           → Current weather display
  freshness-indicator.tsx     → Bean age badge

/lib                          → Core logic (pure functions)
  algorithm.ts                → Recipe calculation engine (PURE FUNCTION)
  types.ts                    → TypeScript interfaces for all domain objects
  profile.ts                  → localStorage helpers (save/load/clear profile)
  weather.ts                  → Weather API client with 30min cache
  geodb-cities.ts             → City search API client

/data                         → Equipment/bean databases (JSON)
  machines.json               → Machine specs (brand, pressure, boiler, etc.)
  grinders.json               → Grinder specs (burr type, RPM, step size)
  origins.json                → Coffee origins with extraction modifiers
  varietals.json              → Coffee varietals with characteristics
  blends.json                 → Blend profiles with modifiers
```

### Type System (`lib/types.ts`)

All domain objects are strongly typed. Key interfaces:
- `UserProfile`: Machine + Grinder + Basket + Location
- `BeanInfo`: Roast level, process, age, origin/varietal (single) or blend profile
- `BrewTargets`: Ratio, brew time range, taste preference
- `AlgorithmInput`: Profile + Bean + Targets + Weather
- `AlgorithmOutput`: Dose, grind setting, yield, temp, EY, confidence, tips, reasoning

### Environment Variables

Optional API keys (app works without them, using defaults):
- `NEXT_PUBLIC_OPENWEATHERMAP_API_KEY`: Weather data (free tier at openweathermap.org)
- `NEXT_PUBLIC_GEODB_API_KEY`: City search autocomplete (free 86k/day at RapidAPI)

Copy `.env.example` to `.env.local` to configure.

## Important Conventions

1. **Algorithm is pure**: `calculateRecipe()` has NO side effects. All inputs passed as arguments, all outputs returned. Never fetch data or mutate state inside it.

2. **Micron adjustments**: When modifying grind logic, express changes in microns, not percentages or arbitrary numbers. Reference: Encore ESP step ≈ 20 microns.

3. **Equipment databases**: When adding machines/grinders, follow existing JSON format strictly. Include `micronPerStep` for grinders when known (improves accuracy).

4. **TypeScript paths**: Use `@/*` alias for imports (maps to repo root). E.g., `import { calculateRecipe } from "@/lib/algorithm"`.

5. **Client-side only**: All logic runs in browser. No server actions, no API routes (except optional weather/city APIs).

## Common Tasks

### Adding a new machine/grinder
Edit `/data/machines.json` or `/data/grinders.json`. Follow existing format. Key specs:
- Machines: pressure, boiler type, group head size, warmup time (for E61)
- Grinders: burr type/size, RPM, espresso range, `micronPerStep` (critical for accuracy)

### Modifying grind algorithm
All logic is in `lib/algorithm.ts` → `calculateGrindSetting()`. Add adjustments as micron values, convert with `micronsToSteps()`, push to `adjustments[]` array for transparency.

### Testing a specific scenario
Use dev server (`pnpm dev`), set up profile once, then iterate on bean inputs. Algorithm runs instantly on every change. Check browser console for weather API logs.

### Adding a new bean characteristic
1. Add field to `BeanInfo` type in `lib/types.ts`
2. Update `brew-form.tsx` to collect it
3. Add adjustment logic to `calculateGrindSetting()` in `lib/algorithm.ts`
4. If needed, create new JSON data file (like `varietals.json`) and import in algorithm

## Debugging Tips

- **Grind too coarse/fine**: Check algorithm's reasoning output — it shows every adjustment applied
- **Weather not loading**: Check browser console for API errors, verify `.env.local` has valid key
- **Profile not saving**: localStorage may be disabled (private browsing). Check `lib/profile.ts` logs
- **TypeScript errors**: Run `pnpm build` to see all type errors at once

## Design Rationale

The algorithm was redesigned from a percentage-based system to a micron-based system because:

1. **Midpoint baseline was wrong**: Most grinders' espresso ranges (e.g., Encore ESP 1-20) are not centered on good espresso. Real-world users dial in at the fine end (3-8 for medium roast), not the midpoint (10.5). Starting at 25% of range matches real usage.

2. **Percentage modifiers were too weak**: A ±5% shift on a normalized scale is ~1 step on a 20-step range. This can't overcome a bad baseline. Micron-based adjustments (e.g., "dark roast +80 microns = 4 steps coarser on Encore") are physically meaningful.

3. **Pressure logic was backwards**: The old algorithm went coarser for 15-bar machines. This is wrong — higher pressure pushes water harder, requiring MORE puck resistance (finer grind) to maintain target brew time.

When making changes to the algorithm, preserve this micron-based approach and always validate against the calibration reference (Encore ESP + Stilosa → setting ~4).
