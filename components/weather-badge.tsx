import type { WeatherData } from "@/lib/types";

interface WeatherBadgeProps {
	weather: WeatherData | null;
	city?: string;
}

export function WeatherBadge({ weather, city }: WeatherBadgeProps) {
	if (!weather) {
		return null;
	}

	return (
		<div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 px-4 py-2 bg-coffee-dark border border-coffee-medium rounded-lg text-sm">
			<div className="flex items-center gap-3 w-full sm:w-auto">
				<div className="flex items-center gap-2">
					<span className="text-amber">🌡️</span>
					<span className="text-cream">{Math.round(weather.temperatureC)}°C</span>
				</div>
				<div className="w-px h-4 bg-coffee-medium hidden sm:block" />
				<div className="flex items-center gap-2">
					<span className="text-amber">💧</span>
					<span className="text-cream">{Math.round(weather.humidity)}%</span>
				</div>
			</div>
			{city && (
				<>
					<div className="w-px h-4 bg-coffee-medium hidden sm:block" />
					<span className="text-cream-dark text-xs truncate max-w-[200px]">{city}</span>
				</>
			)}
		</div>
	);
}
