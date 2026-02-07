# Dial — Espresso Recipe Calculator

A modern, deterministic espresso dial-in calculator that recommends grind size and dose based on your equipment, beans, and environment.

![Coffee theme with specialty instrument panel aesthetic](https://via.placeholder.com/800x400/1a1209/c87941?text=Dial)

## Features

- **Personalized Recommendations**: Get precise dose and grind settings based on your specific equipment
- **Equipment Database**: Pre-configured specs for 20+ espresso machines and 18+ grinders
- **Weather Integration**: Real-time weather adjustments (humidity and temperature affect extraction)
- **Deterministic Algorithm**: Rules-based calculations you can understand and trust
- **Beautiful UI**: Dark coffee theme with smooth animations
- **Mobile-First**: Optimized for use at your coffee station
- **No Backend**: All data stored locally in your browser

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- (Optional) OpenWeatherMap API key for weather-based adjustments

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dialing
```

2. Install dependencies:
```bash
pnpm install
```

3. (Optional but recommended) Set up API keys:
```bash
cp .env.example .env.local
```
Then edit `.env.local` and add your API keys:
- **OpenWeatherMap** - Get a free key at https://openweathermap.org/api (for weather-based extraction adjustments)
- **GeoDB Cities** - Get a free key at https://rapidapi.com/wirefreethought/api/geodb-cities (for city search autocomplete, 86k requests/day free)

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### 1. Set Up Your Profile

Enter your equipment once:
- **Machine**: Brand, model, pressure, boiler type, etc.
- **Grinder**: Brand, model, burr type, setting range
- **Basket**: Type (pressurized/non-pressurized/precision), size, capacity
- **Location**: For weather data (auto-detected or manual)

### 2. Enter Bean Details

For each brew session:
- Roast level and date
- Process method (washed, natural, etc.)
- Origin and varietal (optional)

### 3. Set Your Preferences

- **Target ratio**: Ristretto (1:1.5) to Lungo (1:3)
- **Brew time**: Your desired extraction time range
- **Taste preference**: Balanced, body, sweetness, or bright

### 4. Get Your Recipe

The algorithm calculates:
- **Dose**: Based on basket capacity and bean density
- **Grind setting**: Adjusted for roast, freshness, pressure, humidity, and more
- **Expected yield and brew time**
- **Contextual tips**: Specific to your setup and conditions

## The Algorithm

The calculator uses a deterministic, rules-based algorithm. Key factors:

**Dose Calculation:**
- Basket capacity baseline
- Roast level density adjustment
- Rounded to nearest 0.5g

**Grind Setting Calculation:**
- Starts at grinder's espresso range midpoint
- Applies adjustments for:
  - Roast level (±8%)
  - Bean freshness (±3%)
  - Process method (±2%)
  - Machine pressure (±5%)
  - Water debit rate (±5%)
  - Basket type (±20% for pressurized)
  - Humidity (±2%)
  - Temperature (±1%)
  - Taste preference (±3%)
  - Target ratio (±2%)
- Converts to grinder's actual setting scale

All reasoning is transparent and shown in the UI.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Fonts**: Playfair Display (headings) + DM Sans (body)
- **Data Storage**: localStorage
- **Weather API**: OpenWeatherMap (optional)

## Project Structure

```
/app
  /page.tsx              → Main calculator page
  /profile/page.tsx      → Equipment profile setup
  /layout.tsx            → Root layout
  /globals.css           → Tailwind + custom styles
/components
  /brew-form.tsx         → Bean info input form
  /result-card.tsx       → Recipe display
  /profile-form.tsx      → Equipment setup form
  /equipment-select.tsx  → Searchable dropdowns
  /weather-badge.tsx     → Weather display
  /freshness-indicator.tsx → Roast date badge
/lib
  /algorithm.ts          → Pure recipe calculation
  /weather.ts            → Weather API + caching
  /profile.ts            → localStorage helpers
  /types.ts              → TypeScript interfaces
/data
  /machines.json         → Machine database
  /grinders.json         → Grinder database
```

## Contributing

Want to add your espresso machine or grinder to the database?

1. Edit `/data/machines.json` or `/data/grinders.json`
2. Follow the existing format
3. Submit a pull request

## License

MIT

## Acknowledgments

Built for coffee nerds who want to understand their espresso, not just follow blind recipes.
