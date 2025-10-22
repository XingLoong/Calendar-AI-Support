import { useEffect } from 'react';

export default function ConsoleSilencer() {
	useEffect(() => {
		const originalWarn = console.warn;

		console.warn = (...args: unknown[]) => {
			const first = args[0];
			if (
				typeof first === 'string' &&
				first.includes('non-data parts text in the response')
			) {
				return;
			}
			originalWarn(...args);
		};

		return () => {
			console.warn = originalWarn;
		};
	}, []);

	return null;
}
