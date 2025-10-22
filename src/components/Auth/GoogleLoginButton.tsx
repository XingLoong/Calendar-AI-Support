import React from 'react';

interface GoogleLoginButtonProps {
	clientId: string;
	scope: string;
	onLoginSuccess: (accessToken: string) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
	clientId,
	scope,
	onLoginSuccess,
}) => {
	const handleLogin = () => {
		if (!window.google?.accounts?.oauth2) {
			console.error('Google Identity script not loaded');
			return;
		}

		const client = window.google.accounts.oauth2.initTokenClient({
			client_id: clientId,
			scope,
			callback: (response) => {
				if (response.access_token) {
					onLoginSuccess(response.access_token);
				} else {
					console.error('No access token returned:', response);
				}
			},
		});

		client.requestAccessToken();
	};

	return (
		<button
			onClick={handleLogin}
			className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
		>
			Sign in with Google
		</button>
	);
};

export default GoogleLoginButton;
