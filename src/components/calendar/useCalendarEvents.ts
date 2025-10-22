import type { DateClickArg } from '@fullcalendar/interaction';
import { useState, useCallback, useEffect } from 'react';
import { createEvent, fetchEvents } from '../google/useGoogleCalendar';

export interface EventFormData {
	summary: string;
	description: string;
	location: string;
	start: string;
	end: string;
}

export const useCalendarEvents = (accessToken: string | null) => {
	const [selectedDateTime, setSelectedDateTime] = useState<Date>();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [loading, setLoading] = useState(false);

	const handleDateClick = useCallback((info: DateClickArg) => {
		console.log('Clicked date:', info.date);
		console.log('Clicked date (full object):', info);
		setSelectedDateTime(info.date);
		setIsModalOpen(true);
	}, []);

	const loadEvents = useCallback(async () => {
		if (!accessToken) return;
		setLoading(true);
		try {
			const googleEvents = await fetchEvents(accessToken);
			setEvents(googleEvents);
			console.log('Loaded Google events:', googleEvents);
		} catch (error) {
			console.error('Failed to load Google events:', error);
		} finally {
			setLoading(false);
		}
	}, [accessToken]);

	useEffect(() => {
		loadEvents();
	}, [loadEvents]);

	const handleAddEvent = useCallback(
		async (data: EventFormData) => {
			const { summary, description, location, start, end } = data;

			const eventPayload = {
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

			console.log('Created event payload:', eventPayload);
			if (!accessToken) {
				alert('Google access token not found.  Please log in again');
				return;
			}
			try {
				const createdEvent = await createEvent(accessToken, data);
				console.log('Google Calendar event created:', createdEvent);

				await loadEvents();
				// alert(updated!?)
			} catch (error) {
				console.error('Failed to add event to Google Calendar:', error);
				alert(
					'Failed to add event to Google Calendar. Check console for details.',
				);
			}
		},
		[accessToken, loadEvents],
	);

	return {
		isModalOpen,
		setIsModalOpen,
		selectedDateTime,
		handleDateClick,
		handleAddEvent,
		events,
		loading,
		refreshEvents: loadEvents,
	};
};
