const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RECENT_DAYS = 7;

const shortDateFormatter = new Intl.DateTimeFormat("es-MX", {
	day: "2-digit",
	month: "short",
});

const fullDateTitleFormatter = new Intl.DateTimeFormat("es-MX", {
	dateStyle: "medium",
	timeStyle: "short",
});

export interface RelativeTime {
	label: string;
	dateTime: string | undefined;
	title: string | undefined;
}

export function formatRelativeTime(
	value: string,
	now: Date = new Date(),
): RelativeTime {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return {
			label: "Sin fecha",
			dateTime: undefined,
			title: undefined,
		};
	}

	return {
		label: formatElapsed(date, now),
		dateTime: value,
		title: fullDateTitleFormatter.format(date),
	};
}

function formatElapsed(date: Date, now: Date): string {
	const elapsed = Math.max(0, now.getTime() - date.getTime());

	if (elapsed < MINUTE_MS) {
		return "Hace unos segundos";
	}

	if (elapsed < HOUR_MS) {
		return `Hace ${Math.floor(elapsed / MINUTE_MS)} min`;
	}

	if (elapsed < DAY_MS) {
		return `Hace ${Math.floor(elapsed / HOUR_MS)} h`;
	}

	if (elapsed < RECENT_DAYS * DAY_MS) {
		const days = Math.floor(elapsed / DAY_MS);

		return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
	}

	return shortDateFormatter.format(date).replace(/\.$/, "");
}
