interface FreshnessIndicatorProps {
	daysAgo: number;
}

export function FreshnessIndicator({ daysAgo }: FreshnessIndicatorProps) {
	let status: "too-fresh" | "fresh" | "peak" | "aging";
	let label: string;
	let color: string;
	let bgColor: string;

	// Aligned with algorithm: 7-14 days is peak based on espresso degassing research
	if (daysAgo < 5) {
		status = "too-fresh";
		label = "Too fresh ⚠️";
		color = "text-amber";
		bgColor = "bg-coffee-medium";
	} else if (daysAgo >= 5 && daysAgo <= 6) {
		status = "fresh";
		label = "Fresh ✓";
		color = "text-cream";
		bgColor = "bg-espresso";
	} else if (daysAgo >= 7 && daysAgo <= 14) {
		status = "peak";
		label = "Peak ✓✓";
		color = "text-amber";
		bgColor = "bg-espresso border border-amber";
	} else {
		status = "aging";
		label = "Aging ⚠️";
		color = "text-cream-dark";
		bgColor = "bg-coffee-medium";
	}

	return (
		<span
			className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${color} ${bgColor}`}
			data-freshness-status={status}
		>
			{label}
		</span>
	);
}
