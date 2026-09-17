import { useState, useEffect } from 'react';
import { authApi } from '../../../services/authApi';

export default function GoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Google Identity Services when component mounts
    const initializeGoogle = () => {
      const google = (window as any).google;
      
      if (google && google.accounts) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id',
          callback: handleGoogleCredential,
          auto_select: false,
        });
      }
    };

    // Wait for Google SDK to load
    if ((window as any).google) {
      initializeGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if ((window as any).google) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 100);

      setTimeout(() => clearInterval(checkGoogle), 5000);
    }
  }, []);

  const handleGoogleCredential = async (response: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await authApi.authenticateWithGoogle(response.credential);
      
      if (authResponse.success) {
        console.log('Google authentication successful:', authResponse.user);
        window.location.reload(); // Reload to update auth state
      } else {
        setError(authResponse.error || 'Authentication failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Authentication failed');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError(null);

    const google = (window as any).google;
    
    if (!google || !google.accounts) {
      setError('Google SDK not loaded. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    try {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          // If prompt is not displayed, try to show the button
          const buttonDiv = document.createElement('div');
          google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
          });
          // Click the button programmatically
          const button = buttonDiv.querySelector('button');
          if (button) button.click();
        }
        if (notification.isSkipped()) {
          setIsLoading(false);
        }
      });
    } catch (err) {
      setError('Failed to initialize Google login');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded transition-all hover:opacity-80 disabled:opacity-50"
      style={{
        background: 'rgba(234, 67, 53, 0.1)',
        border: '1px solid rgba(234, 67, 53, 0.3)',
        color: '#ea4335',
      }}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          letterSpacing: '0.04em',
        }}
      >
        {isLoading ? '...' : 'Google'}
      </span>
    </button>
  );
}
