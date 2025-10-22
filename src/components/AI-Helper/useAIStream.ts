import { GoogleGenAI } from '@google/genai';
import type { GenerateContentParameters } from '@google/genai';

export function useAIStream(ai: GoogleGenAI) {
	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

	function isAsyncIterable(obj: unknown): obj is AsyncIterable<unknown> {
		return (
			obj != null &&
			typeof (obj as { [Symbol.asyncIterator]?: unknown })[
				Symbol.asyncIterator
			] === 'function'
		);
	}

	async function streamWithRetry(
		payload: GenerateContentParameters,
		retries = 3,
		onChunk?: (text: string) => void,
	): Promise<void> {
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				const maybeStream = await ai.models.generateContentStream(payload);

				let iterable: AsyncIterable<unknown> | null = null;
				if (isAsyncIterable(maybeStream)) iterable = maybeStream;
				else if (
					maybeStream &&
					typeof maybeStream === 'object' &&
					isAsyncIterable((maybeStream as { stream?: unknown }).stream)
				)
					iterable = (maybeStream as { stream: AsyncIterable<unknown> }).stream;

				if (!iterable)
					throw new Error('generateContentStream returned no iterable');

				for await (const rawChunk of iterable) {
					if (!rawChunk || typeof rawChunk !== 'object') continue;
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
				return;
			} catch (err) {
				const e = err as {
					error?: { code?: number; message?: string };
					code?: number;
					message?: string;
				};
				const code = e?.error?.code ?? e?.code;
				if ((code === 503 || code === 14) && attempt < retries) {
					await sleep(1500 * attempt);
					continue;
				}
				throw err;
			}
		}
		throw new Error('Stream failed after maximum retry attempts.');
	}

	return { streamWithRetry };
}
