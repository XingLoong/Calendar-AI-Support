import React, { useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useAIStream } from './useAIStream';
import { useEventContext } from './useEventContext';
import { ChatMessages } from './ChatMessages';
import { formatAIText } from '../utils/formatText';

interface AIAssistantProps {
	events?: CalendarEvent[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ events = [] }) => {
	const [messages, setMessages] = useState<
		{ role: 'user' | 'assistant'; content: string }[]
	>(() => {
		const saved = localStorage.getItem('ai-helper-messages');
		return saved ? JSON.parse(saved) : [];
	});
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);

	React.useEffect(() => {
		localStorage.setItem('ai-helper-messages', JSON.stringify(messages));
	}, [messages]);

	const ai = useMemo(
		() =>
			new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_GENAI_API_KEY }),
		[],
	);
	const { streamWithRetry } = useAIStream(ai);
	const formatEventContext = useEventContext(events);

	const handleSend = async () => {
		const userInput = input.trim();
		if (!userInput) return;

		setMessages((prev) => [...prev, { role: 'user', content: userInput }]);
		setInput('');
		setLoading(true);

		const now = new Date();
		const currentLocalTime = now.toLocaleString(undefined, {
			timeZoneName: 'short',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			weekday: 'long',
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});

		const systemInstruction = `
You are a scheduling assistant for a home-services calendar app.

Business hours are Monday to Friday, from 0700 to 1800, and Saturday, from 0900 to 1700.
Your boss is a handyman who is stationed at location A (79 Anderson Rd, Sunshine VIC 3020) who travels between jobs at different locations.
The user is a client that potentially wants to hire your boss for a job.

Each event in their calendar represents a booked job with:
- summary (job name)
- start time
- end time
- location (suburb/address)
- description (Name and phone number of client)

Your goal:
- Recommend the earliest available booking time within the next 5 days.
- The requested job duration can be 30, 120, or 480 minutes.
- Avoid overlapping with existing events.
- If a location C is provided, find the nearest availability near an existing event location B (within ~20 mins).
- Assume travel times between suburbs are typically 10 to 30 minutes by car/van unless they are far apart.
- The first job of the day may start anywhere (ignore travel before it).
- Suggest practical booking windows and include short reasoning.

Today's current local time is: ${currentLocalTime}.
Make sure all reasoning and time suggestions are consistent with this current time and the next 5 days.

Output format:
- "Recommended slot: [Date] [Start → End], Location [suburb]"
- "Reasoning: ..."
- "Alternative: ..." (optional)

You must only answer questions related to scheduling, calendar management, job bookings, or travel times between appointments. Politely refuse or redirect any unrelated or inappropriate requests.
Avoid giving out condemning reasons of timings related to the boss.

`;

		const structuredPrompt = [
			{
				role: 'user',
				parts: [{ text: `Events:\n${formatEventContext()}` }],
			},
			{
				role: 'user',
				parts: [{ text: `User request: "${userInput}"` }],
			},
		];

		let streamedText = '';

		try {
			await streamWithRetry(
				{
					model: 'gemini-2.5-pro',
					contents: structuredPrompt,
					config: { systemInstruction },
				},
				3,
				(chunkText) => {
					streamedText += chunkText;
					const formatted = formatAIText(streamedText);
					setMessages((prev) => {
						const last = prev.at(-1);
						if (last?.role === 'assistant') {
							return [...prev.slice(0, -1), { ...last, content: formatted }];
						}
						return [...prev, { role: 'assistant', content: formatted }];
					});
				},
			);
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: typeof error === 'string'
					? error
					: 'Unknown error occurred';

			console.error('AI stream failed:', message);
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content: 'Sorry, something went wrong fetching a response.',
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex flex-col h-full bg-gray-50 border-t border-gray-200 p-3 rounded-lg'>
			<ChatMessages messages={messages} loading={loading} />
			<div className='flex gap-2'>
				<input
					type='text'
					className='flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring'
					placeholder='Type a job request or scheduling question...'
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSend()}
					disabled={loading}
				/>
				<button
					onClick={handleSend}
					className='px-3 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50'
					disabled={loading}
				>
					Send
				</button>
			</div>
		</div>
	);
};

export default AIAssistant;
