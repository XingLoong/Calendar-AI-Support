import type { DateClickArg } from '@fullcalendar/interaction';
import { useState, useCallback } from 'react';
import { createEvent } from '../google/useGoogleCalendar';

export const useCalendarEvents = (
	accessToken: string | null,
	onCalendarRefresh: () => void,
) => {
	const [selectedDateTime, setSelectedDateTime] = useState<Date>();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleDateClick = useCallback((info: DateClickArg) => {
		console.log('Clicked date (full object):', info);
		setSelectedDateTime(info.date);
		setIsModalOpen(true);
	}, []);

	const handleAddEvent = useCallback(
		async (data: CalendarEventInput) => {
			// const { summary, description, location, start, end } = data;

			// const eventPayload = {
			// 	summary,
			// 	description,
			// 	location,
			// 	start: {
			// 		dateTime: new Date(start).toISOString(),
			// 		timeZone: 'Australia/Melbourne',
			// 	},
			// 	end: {
			// 		dateTime: new Date(end).toISOString(),
			// 		timeZone: 'Australia/Melbourne',
			// 	},
			// };

			// console.log('Created event payload:', eventPayload);

			if (!accessToken) {
				alert('Google access token not found.  Please log in again');
				return;
			}

			try {
				setLoading(true);
				await createEvent(accessToken, data);
				onCalendarRefresh();
				// alert?
			} catch (error) {
				console.error('Failed to add event to Google Calendar:', error);
				alert(
					'Failed to add event to Google Calendar. Check console for details.',
				);
			} finally {
				setLoading(false);
				setIsModalOpen(false);
			}
		},
		[accessToken, onCalendarRefresh],
	);

	return {
		isModalOpen,
		setIsModalOpen,
		selectedDateTime,
		handleDateClick,
		handleAddEvent,
		loading,
	};
};
