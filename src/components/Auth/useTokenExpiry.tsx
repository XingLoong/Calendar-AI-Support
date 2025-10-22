import { useEffect, useState, useCallback, useRef } from 'react';

interface UseTokenExpiryProps {
	accessToken: string | null;
	onRefresh: (newToken: string) => void;
	onLogout: () => void;
	clientId: string;
	scope: string;
}

export function useTokenExpiry({
	accessToken,
	onRefresh,
	onLogout,
	clientId,
	scope,
}: UseTokenExpiryProps) {
	const [showPrompt, setShowPrompt] = useState(false);
	const [isIdle, setIsIdle] = useState(false);
	const idleTimer = useRef<NodeJS.Timeout | null>(null);

	// Track activity
	useEffect(() => {
		const resetIdle = () => {
			setIsIdle(false);
			if (idleTimer.current) clearTimeout(idleTimer.current);
			idleTimer.current = setTimeout(() => setIsIdle(true), 3 * 60 * 1000); // 3 mins idle
		};

		['mousemove', 'keydown', 'click', 'scroll'].forEach((evt) =>
			window.addEventListener(evt, resetIdle),
		);

		resetIdle(); // start tracking

		return () => {
			['mousemove', 'keydown', 'click', 'scroll'].forEach((evt) =>
				window.removeEventListener(evt, resetIdle),
			);
			if (idleTimer.current) clearTimeout(idleTimer.current);
		};
	}, []);

	// Save issue time
	useEffect(() => {
		if (accessToken) {
			sessionStorage.setItem('token_issue_time', Date.now().toString());
		}
	}, [accessToken]);

	// Silent refresh logic
	const refreshToken = useCallback(() => {
		if (!window.google?.accounts?.oauth2) {
			console.error('Google Identity API not loaded.');
			return;
		}

		const client = window.google.accounts.oauth2.initTokenClient({
			client_id: clientId,
			scope,
			callback: (response) => {
				if (response.access_token) {
					sessionStorage.setItem('google_access_token', response.access_token);
					sessionStorage.setItem('token_issue_time', Date.now().toString());
					setShowPrompt(false);
					onRefresh(response.access_token);
				} else {
					console.error('Token refresh failed:', response);
					onLogout();
				}
			},
		});

		// silent = no user interaction
		client.requestAccessToken({ prompt: '' });
	}, [clientId, scope, onRefresh, onLogout]);

	// Expiry timer
	useEffect(() => {
		if (!accessToken) return;

		const issueTime = Number(sessionStorage.getItem('token_issue_time'));
		const expiryTime = issueTime + 60 * 60 * 1000; // 1 hour
		const warnAt = expiryTime - 5 * 60 * 1000; // 5 minutes before expiry

		const now = Date.now();
		const delay = Math.max(warnAt - now, 0);

		const timer = setTimeout(() => {
			if (document.visibilityState === 'visible' && !isIdle) {
				// user is active → auto refresh silently
				refreshToken();
			} else {
				// idle or backgrounded → ask
				setShowPrompt(true);
			}
		}, delay);

		return () => clearTimeout(timer);
	}, [accessToken, isIdle, refreshToken]);

	return {
		showPrompt,
		refreshToken,
		dismissPrompt: () => setShowPrompt(false),
	};
}
