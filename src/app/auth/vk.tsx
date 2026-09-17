import { useState, useEffect } from 'react';
import { authApi } from '../../../services/authApi';

export default function VKAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for token from popup callback
    const checkToken = setInterval(() => {
      const token = (window as any).vkOAuthToken;
      const userId = (window as any).vkOAuthUserId;
      if (token && userId) {
        clearInterval(checkToken);
        handleVKToken(token, userId);
        delete (window as any).vkOAuthToken;
        delete (window as any).vkOAuthUserId;
      }
    }, 500);

    return () => clearInterval(checkToken);
  }, []);

  const handleVKLogin = () => {
    setIsLoading(true);
    setError(null);

    const clientId = import.meta.env.VITE_VK_CLIENT_ID || 'your_vk_client_id';
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/vk/callback');
    const scope = encodeURIComponent('email');
    const response_type = 'token';
    
    const vkAuthUrl = `https://oauth.vk.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${response_type}&v=5.131`;

    // Open popup for VK OAuth
    const popup = window.open(
      vkAuthUrl,
      'VK Auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      setError('Popup was blocked. Please allow popups for this site.');
      setIsLoading(false);
      return;
    }

    // Check if popup is closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        setError('Authentication was cancelled');
      }
    }, 1000);

    // Cleanup after timeout
    setTimeout(() => {
      clearInterval(checkClosed);
      if (!popup.closed) {
        popup.close();
      }
      setIsLoading(false);
    }, 120000); // 2 minutes timeout
  };

  const handleVKToken = async (token: string, userId: string) => {
    try {
      const authResponse = await authApi.authenticateWithVK(token, userId);
      
      if (authResponse.success) {
        console.log('VK authentication successful:', authResponse.user);
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

  return (
    <button
      onClick={handleVKLogin}
      disabled={isLoading}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded transition-all hover:opacity-80 disabled:opacity-50"
      style={{
        background: 'rgba(74, 118, 168, 0.1)',
        border: '1px solid rgba(74, 118, 168, 0.3)',
        color: '#4a76a8',
      }}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.756 4 8.57c0-.102.102-.203.593-.203h1.744c.44 0 .61.17.78.678.847 2.456 2.27 4.607 2.845 4.607.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.17.17-.339.44-.339h2.746c.373 0 .508.17.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
        </svg>
      )}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          letterSpacing: '0.04em',
        }}
      >
        {isLoading ? '...' : 'VK'}
      </span>
    </button>
  );
}
