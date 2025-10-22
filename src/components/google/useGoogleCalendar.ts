const CALENDAR_ID = 'primary'; // or your custom calendar ID
const API_BASE = import.meta.env.VITE_GOOGLE_API_BASE_URL;

export async function fetchEvents(accessToken: string) {
	if (!accessToken) throw new Error('Missing access token');

	const response = await fetch(
		`${API_BASE}/calendars/${encodeURIComponent(
			CALENDAR_ID,
		)}/events?singleEvents=true&orderBy=startTime`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		},
	);

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		console.error('Error fetching events:', error);
		throw new Error(error.error?.message || 'Failed to fetch events');
	}

	const data = await response.json();
	return data.items || [];
}

export async function createEvent(
	accessToken: string,
	eventData: CalendarEventInput,
): Promise<CalendarEvent> {
	if (!accessToken) throw new Error('Missing access token');

	const { summary, description, location, start, end } = eventData;

	if (!start || !end) {
		throw new Error('Event must include start and end times.');
	}

	const newEvent = {
		summary,
		description,
		location,
		start: {
			dateTime: new Date(start).toISOString(),
			timeZone: 'Australia/Melbourne',
		},
		end: {
			dateTime: new Date(end).toISOString(),
			timeZone: 'Australia/Melbourne',
		},
	};

	const response = await fetch(
		`${API_BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(newEvent),
		},
	);

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		console.error('Error creating event:', error);
		throw new Error(error.error?.message || 'Failed to create event');
	}

	return response.json();
}

export async function deleteEvent(accessToken: string, eventId: string) {
	if (!accessToken) throw new Error('Missing access token');

	const response = await fetch(
		`${API_BASE}/calendars/${encodeURIComponent(
			CALENDAR_ID,
		)}/events/${eventId}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		console.error('Error deleting event:', error);
		throw new Error(error.error?.message || 'Failed to delete event');
	}

	return true;
}
