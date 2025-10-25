const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID;
const API_BASE = import.meta.env.VITE_GOOGLE_API_BASE_URL;

export async function fetchEvents(
	accessToken: string,
	onInvalidToken?: () => void,
): Promise<CalendarEvent[]> {
	try {
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
				CALENDAR_ID,
			)}/events?maxResults=50&orderBy=startTime&singleEvents=true`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);

		if (response.status === 401 || response.status === 403) {
			console.warn('Access token invalid or expired. Logging out...');
			onInvalidToken?.(); // triggers logout callback
			return [];
		}

		if (!response.ok) {
			console.error('Failed to fetch calendar events:', response.statusText);
			return [];
		}

		const data = await response.json();

		if (!Array.isArray(data.items)) {
			console.warn(
				'Unexpected response format from Google Calendar API:',
				data,
			);
			return [];
		}

		return data.items as CalendarEvent[];
	} catch (err) {
		console.error('Error fetching calendar events:', err);
		return [];
	}
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

	if (response.status === 401 || response.status === 403) {
		throw new Error('Access token invalid or expired');
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		console.error('Error creating event:', error);
		throw new Error(error.error?.message || 'Failed to create event');
	}

	return response.json();
}

export async function deleteEvent(
	accessToken: string,
	eventId: string,
): Promise<boolean> {
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

	if (response.status === 401 || response.status === 403) {
		throw new Error('Access token invalid or expired');
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		console.error('Error deleting event:', error);
		throw new Error(error.error?.message || 'Failed to delete event');
	}

	return true;
}
