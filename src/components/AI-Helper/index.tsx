import React, { useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { GenerateContentParameters } from '@google/genai';
import { formatAIText } from '../utils/formatText';

interface AIAssistantProps {
	events?: CalendarEvent[];
}

type Role = 'user' | 'assistant';

interface Message {
	role: Role;
	content: string;
}

async function streamWithRetry(
	ai: GoogleGenAI,
	payload: GenerateContentParameters,
	retries = 3,
	onChunk?: (text: string) => void,
): Promise<void> {
	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

	function isAsyncIterable(obj: unknown): obj is AsyncIterable<unknown> {
		return (
			obj != null &&
			typeof (obj as { [Symbol.asyncIterator]?: unknown })[
				Symbol.asyncIterator
			] === 'function'
		);
	}

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const maybeStream = await ai.models.generateContentStream(payload);

			let iterable: AsyncIterable<unknown> | null = null;
			if (isAsyncIterable(maybeStream)) {
				iterable = maybeStream;
			} else if (
				maybeStream &&
				typeof maybeStream === 'object' &&
				isAsyncIterable((maybeStream as { stream?: unknown }).stream)
			) {
				iterable = (maybeStream as { stream: AsyncIterable<unknown> }).stream;
			}

			if (!iterable)
				throw new Error('generateContentStream returned no iterable');

			for await (const rawChunk of iterable) {
				if (!rawChunk || typeof rawChunk !== 'object') continue;

				// safely inspect data
				const chunk = rawChunk as Record<string, unknown>;
				const data = chunk['data'] as Record<string, unknown> | undefined;
				const textValue =
					(typeof chunk['text'] === 'string'
						? chunk['text']
						: typeof data?.['text'] === 'string'
						? data['text']
						: undefined) ?? undefined;

				if (typeof textValue === 'string' && textValue.trim().length > 0) {
					onChunk?.(textValue);
				}
			}

			return; // ✅ success — exit retry loop
		} catch (err) {
			const error = err as {
				error?: { code?: number; message?: string };
				code?: number;
				message?: string;
			};

			const code = error?.error?.code ?? error?.code;
			const message = error?.error?.message ?? error?.message ?? String(err);

			if ((code === 503 || code === 14) && attempt < retries) {
				console.warn(
					`Model overloaded (attempt ${attempt}), retrying in ${
						1500 * attempt
					}ms...`,
					message,
				);
				await sleep(1500 * attempt);
				continue;
			}

			throw err;
		}
	}

	throw new Error('Stream failed after maximum retry attempts.');
}

const AIAssistant: React.FC<AIAssistantProps> = ({ events = [] }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);

	const ai = useMemo(
		() =>
			new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_GENAI_API_KEY }),
		[],
	);

	const formatEventContext = (): string => {
		if (!events.length) return '[]';

		const now = new Date();
		const fiveDaysAhead = new Date();
		fiveDaysAhead.setDate(now.getDate() + 5);

		const toLocalISOString = (
			dateStr?: string | Date | null,
		): string | null => {
			if (!dateStr) return null;
			const d =
				dateStr instanceof Date ? dateStr : new Date(dateStr.toString());
			if (isNaN(d.getTime())) return null;
			// Return local ISO (without timezone offset)
			return new Date(
				d.getTime() - d.getTimezoneOffset() * 60000,
			).toISOString();
		};

		const filtered = events.filter((event) => {
			const start =
				event.start instanceof Date
					? event.start
					: event.start?.dateTime
					? new Date(event.start.dateTime)
					: event.start?.date
					? new Date(event.start.date)
					: null;
			return start && start >= now && start <= fiveDaysAhead;
		});

		const simplified = filtered.map((event) => {
			const start =
				event.start instanceof Date
					? toLocalISOString(event.start)
					: event.start?.dateTime
					? toLocalISOString(event.start.dateTime)
					: event.start?.date
					? toLocalISOString(event.start.date)
					: null;

			const end =
				event.end instanceof Date
					? toLocalISOString(event.end)
					: event.end?.dateTime
					? toLocalISOString(event.end.dateTime)
					: event.end?.date
					? toLocalISOString(event.end.date)
					: null;

			return {
				id: event.id ?? '',
				summary: event.summary ?? 'Untitled Event',
				start,
				end,
				location: event.location ?? '',
				description: event.description ?? '',
			};
		});

		return JSON.stringify(simplified, null, 2);
	};

	const handleSend = async () => {
		const userInput = input.trim();
		if (!userInput) return;

		const userMessage: Message = { role: 'user', content: userInput };
		setMessages((prev) => [...prev, userMessage]);
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
Your user is a handyman who is stationed at location A (79 Anderson Rd, Sunshine VIC 3020) who travels between jobs at different locations.

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
- "Alternative: ..." (optional
`;

		const structuredPrompt = [
			{
				role: 'user',
				parts: [
					{
						text: `Here are the user's existing events (next 5 days):\n${formatEventContext()}`,
					},
				],
			},
			{
				role: 'user',
				parts: [{ text: `User request: "${userInput}"` }],
			},
		];

		let streamedText = '';

		try {
			await streamWithRetry(
				ai,
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
						const updated = [...prev];
						const last = updated[updated.length - 1];
						if (last?.role === 'assistant') {
							updated[updated.length - 1] = {
								...last,
								content: formatted,
							};
						} else {
							updated.push({ role: 'assistant', content: formatted });
						}
						return [...updated];
					});
				},
			);
		} catch (error) {
			console.error('AI stream failed:', error);
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content:
						'Sorry, I ran into an issue while getting a response from the AI.',
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex flex-col h-full bg-gray-50 border-t border-gray-200 p-3 rounded-lg'>
			<div className='flex-1 overflow-y-auto space-y-2 mb-3'>
				{messages.map((m, i) => (
					<div
						key={i}
						className={`p-2 rounded-lg ${
							m.role === 'user' ? 'bg-blue-100 self-end' : 'bg-white border'
						}`}
					>
						<p className='text-sm whitespace-pre-wrap'>{m.content}</p>
					</div>
				))}
				{loading && <p className='text-gray-400 text-sm italic'>Thinking...</p>}
			</div>

			<div className='flex gap-2'>
				<input
					type='text'
					className='flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring'
					placeholder='Ask something about your schedule...'
					value={input}
					onChange={(event) => setInput(event.target.value)}
					onKeyDown={(event) => event.key === 'Enter' && handleSend()}
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
