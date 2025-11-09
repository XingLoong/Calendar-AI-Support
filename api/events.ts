// api/events.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calendar_v3, google } from 'googleapis';

/**
 * Parse the service account JSON from environment variable
 */
function getServiceAccountJSON() {
	const raw = process.env.GOOGLE_SERVICE_ACCOUNT || '';
	try {
		return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
	} catch (err) {
		const error = err as Error;
		throw new Error(
			'Invalid GOOGLE_SERVICE_ACCOUNT JSON in env: ' + error.message,
		);
	}
}

/**
 * Create Google auth client
 */
async function getAuthClient() {
	const sa = getServiceAccountJSON();
	const jwt = new google.auth.JWT({
		email: sa.client_email,
		key: sa.private_key,
		scopes: ['https://www.googleapis.com/auth/calendar'],
	});
	await jwt.authorize();
	return jwt;
}

/**
 * Serverless handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	const calendarId = process.env.GOOGLE_CALENDAR_ID;

	if (!calendarId) {
		return res.status(500).json({ error: 'Missing GOOGLE_CALENDAR_ID' });
	}

	try {
		const auth = await getAuthClient();
		const calendar = google.calendar({ version: 'v3', auth });

		/** GET: list upcoming events */
		if (req.method === 'GET') {
			const now = new Date(Date.now() - 1000 * 60).toISOString();
			const response = await calendar.events.list({
				calendarId,
				timeMin: now,
				singleEvents: true,
				orderBy: 'startTime',
				maxResults: 250,
			});

			const events = (response.data.items || []).map((ev) => ({
				id: ev.id,
				title: ev.summary || '',
				start: ev.start?.dateTime || ev.start?.date || '',
				end: ev.end?.dateTime || ev.end?.date || '',
				description: ev.description || '',
				location: ev.location || '',
			}));

			return res.status(200).json({ events });
		}

		/** POST: create a new event */
		if (req.method === 'POST') {
			const { summary, start, end, description, location } = req.body;

			// Basic validation
			if (!summary || !start || !end) {
				return res.status(400).json({ error: 'Missing required fields' });
			}

			// Convert raw Dates to ISO strings
			const startStr =
				typeof start === 'string' ? start : new Date(start).toISOString();
			const endStr =
				typeof end === 'string' ? end : new Date(end).toISOString();

			// Ensure start < end
			if (new Date(startStr) >= new Date(endStr)) {
				return res.status(400).json({ error: 'Start must be before end' });
			}

			// Helper: build Google EventDateTime
			function buildEventDateTime(
				value: string | Date,
			): calendar_v3.Schema$EventDateTime {
				// all-day event?
				if (/^\d{4}-\d{2}-\d{2}$/.test(value.toString())) {
					return { date: value.toString() };
				}

				let year, month, day, hour, minute;

				if (value instanceof Date) {
					year = value.getFullYear();
					month = (value.getMonth() + 1).toString().padStart(2, '0');
					day = value.getDate().toString().padStart(2, '0');
					hour = value.getHours().toString().padStart(2, '0');
					minute = value.getMinutes().toString().padStart(2, '0');
				} else {
					const d = new Date(value);
					year = d.getFullYear();
					month = (d.getMonth() + 1).toString().padStart(2, '0');
					day = d.getDate().toString().padStart(2, '0');
					hour = d.getHours().toString().padStart(2, '0');
					minute = d.getMinutes().toString().padStart(2, '0');
				}

				const localIso = `${year}-${month}-${day}T${hour}:${minute}:00`;
				return { dateTime: localIso, timeZone: 'Australia/Melbourne' };
			}

			const eventBody: calendar_v3.Schema$Event = {
				summary,
				start: buildEventDateTime(start),
				end: buildEventDateTime(end),
				...(description && { description }),
				...(location && { location }),
			};

			console.log('Creating event with payload:', eventBody);

			try {
				const created = await calendar.events.insert({
					calendarId,
					requestBody: eventBody,
				});
				return res.status(201).json({ event: created.data });
			} catch (e) {
				console.error('Google Calendar API error:', e);
				console.error('Google API response data:', e.response?.data);
				const msg =
					e.response?.data?.error?.message ||
					(e as Error).message ||
					'Unknown error';
				return res.status(500).json({ error: msg });
			}
		}

		// Method not allowed
		return res.status(405).json({ error: 'Method not allowed' });
	} catch (err) {
		const error = err as Error;
		console.error('Serverless handler error:', error);
		return res.status(500).json({ error: error.message });
	}
}
