// api/events.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calendar_v3, google } from 'googleapis';

function getServiceAccountJSON() {
	const raw = process.env.GOOGLE_SERVICE_ACCOUNT || '';
	try {
		return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
	} catch (err) {
		const error = err as Error;
		throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT JSON in env', error);
	}
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const calendarId = process.env.GOOGLE_CALENDAR_ID;
	if (!calendarId)
		return res.status(500).json({ error: 'Missing GOOGLE_CALENDAR_ID' });

	try {
		const auth = await getAuthClient();
		const calendar = google.calendar({ version: 'v3', auth });

		if (req.method === 'GET') {
			const now = new Date().toISOString();
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

		if (req.method === 'POST') {
			const { summary, start, end, description, location } = req.body;
			if (!summary || !start || !end) {
				return res.status(400).json({ error: 'Missing required fields' });
			}

			const eventBody: calendar_v3.Schema$Event = {
				summary,
				description,
				location,
				start: { dateTime: start },
				end: { dateTime: end },
			};

			const created = await calendar.events.insert({
				calendarId,
				requestBody: eventBody,
			});

			return res.status(201).json({ event: created.data });
		}

		return res.status(405).json({ error: 'Method not allowed' });
	} catch (err) {
		const error = err as Error;
		console.error(err);
		return res.status(500).json({ error });
	}
}
