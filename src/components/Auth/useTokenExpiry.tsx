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

	const validateToken = useCallback(async (token: string): Promise<boolean> => {
		try {
			const res = await fetch(
				`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`,
			);

			const data = await res.json();

			if (!res.ok || data.error || data.error_description) {
				console.warn('Invalid or expired token:', data);
				return false;
			}

			if (data.exp && Number(data.exp) * 1000 < Date.now()) {
				console.warn('Token expired (based on exp field):', data);
				return false;
			}

			return true;
		} catch (err) {
			console.error('Error validating token:', err);
			return false;
		}
	}, []);

	// idle detection
	useEffect(() => {
		const resetIdle = () => {
			setIsIdle(false);
			if (idleTimer.current) clearTimeout(idleTimer.current);
			idleTimer.current = setTimeout(() => setIsIdle(true), 3 * 60 * 1000); // 3 min idle
		};

		['mousemove', 'keydown', 'click', 'scroll'].forEach((evt) =>
			window.addEventListener(evt, resetIdle),
		);

		resetIdle();
		return () => {
			['mousemove', 'keydown', 'click', 'scroll'].forEach((evt) =>
				window.removeEventListener(evt, resetIdle),
			);
			if (idleTimer.current) clearTimeout(idleTimer.current);
		};
	}, []);

	useEffect(() => {
		if (accessToken) {
			sessionStorage.setItem('token_issue_time', Date.now().toString());
		}
	}, [accessToken]);

	// Silent refresh
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

		client.requestAccessToken();
	}, [clientId, scope, onRefresh, onLogout]);

	// Verify token on load ---
	useEffect(() => {
		const verify = async () => {
			if (!accessToken) return;
			const valid = await validateToken(accessToken);
			if (!valid) {
				sessionStorage.removeItem('google_access_token');
				sessionStorage.removeItem('token_issue_time');
				onLogout();
			}
		};
		verify();
	}, [accessToken, validateToken, onLogout]);

	// --- 6. Expiry timer ---
	useEffect(() => {
		if (!accessToken) return;

		const issueTime = Number(sessionStorage.getItem('token_issue_time'));
		const expiryTime = issueTime + 60 * 60 * 1000; // 1 hour lifetime
		const warnAt = expiryTime - 5 * 60 * 1000; // warn 5 mins before expiry

		const now = Date.now();
		const delay = Math.max(warnAt - now, 0);

		const timer = setTimeout(() => {
			if (document.visibilityState === 'visible' && !isIdle) {
				refreshToken();
			} else {
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
