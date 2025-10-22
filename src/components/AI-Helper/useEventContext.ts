export function useEventContext(events: CalendarEvent[] = []) {
	return (): string => {
		if (!events.length) return '[]';

		const now = new Date();
		const fiveDaysAhead = new Date(now);
		fiveDaysAhead.setDate(now.getDate() + 5);

		const toLocalISOString = (d?: string | Date | null): string | null => {
			if (!d) return null;
			const date = d instanceof Date ? d : new Date(d.toString());
			if (isNaN(date.getTime())) return null;
			return new Date(
				date.getTime() - date.getTimezoneOffset() * 60000,
			).toISOString();
		};

		const filtered = events.filter((event) => {
			const start =
				event.start instanceof Date
					? event.start
					: new Date(event.start?.dateTime ?? event.start?.date ?? '');
			return start && start >= now && start <= fiveDaysAhead;
		});

		const simplified = filtered.map((e) => ({
			id: e.id ?? '',
			summary: e.summary ?? 'Untitled Event',
			start: toLocalISOString(
				e.start instanceof Date
					? e.start
					: e.start?.dateTime ?? e.start?.date ?? '',
			),
			end: toLocalISOString(
				e.end instanceof Date ? e.end : e.end?.dateTime ?? e.end?.date ?? '',
			),
			location: e.location ?? '',
			description: e.description ?? '',
		}));

		return JSON.stringify(simplified, null, 2);
	};
}
