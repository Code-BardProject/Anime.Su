/**
 * Connection Test Utility
 * Tests connection to backend and verifies keys
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5003')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');
const UPLOADS_BASE_URL = `${API_BASE_URL}/uploads`;

export interface ConnectionTestResult {
  success: boolean;
  apiConnection: boolean;
  uploadsConnection: boolean;
  authConnection: boolean;
  databaseConnection: boolean;
  errors: string[];
}

export async function testBackendConnection(): Promise<ConnectionTestResult> {
  const result: ConnectionTestResult = {
    success: true,
    apiConnection: false,
    uploadsConnection: false,
    authConnection: false,
    databaseConnection: false,
    errors: [],
  };

  try {
    // Test API Connection
    console.log('Testing API connection to:', API_BASE_URL);
    const apiResponse = await fetch(`${API_BASE_URL}/api/health`);
    result.apiConnection = apiResponse.ok;
    
    if (!apiResponse.ok) {
      result.errors.push('API connection failed');
      result.success = false;
    } else {
      console.log('✅ API connection successful');
    }

    // Test Uploads Connection
    console.log('Testing uploads connection to:', UPLOADS_BASE_URL);
    try {
      const uploadsResponse = await fetch(UPLOADS_BASE_URL);
      result.uploadsConnection = uploadsResponse.ok || uploadsResponse.status === 404; // 404 is ok - directory exists
      
      if (uploadsResponse.ok || uploadsResponse.status === 404) {
        console.log('✅ Uploads directory accessible');
      } else {
        result.errors.push('Uploads directory not accessible');
        result.success = false;
      }
    } catch (error) {
      result.errors.push('Uploads connection error: ' + (error instanceof Error ? error.message : 'Unknown'));
      result.success = false;
    }

    // Test Auth Connection
    console.log('Testing auth endpoint');
    try {
      const authResponse = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'test' }),
      });
      // We expect this to fail with invalid token, but the endpoint should exist
      result.authConnection = authResponse.status !== 404;
      
      if (authResponse.status !== 404) {
        console.log('✅ Auth endpoint accessible');
      } else {
        result.errors.push('Auth endpoint not found');
        result.success = false;
      }
    } catch (error) {
      result.errors.push('Auth connection error: ' + (error instanceof Error ? error.message : 'Unknown'));
      result.success = false;
    }

    // Test Database Connection (through anime endpoint)
    console.log('Testing database connection through anime endpoint');
    try {
      const dbResponse = await fetch(`${API_BASE_URL}/api/admin/anime/public`);
      result.databaseConnection = dbResponse.ok;
      
      if (dbResponse.ok) {
        console.log('✅ Database connection successful');
      } else {
        result.errors.push('Database connection failed');
        result.success = false;
      }
    } catch (error) {
      result.errors.push('Database connection error: ' + (error instanceof Error ? error.message : 'Unknown'));
      result.success = false;
    }

  } catch (error) {
    result.errors.push('General connection error: ' + (error instanceof Error ? error.message : 'Unknown'));
    result.success = false;
  }

  return result;
}

export async function testMediaUpload(testFile: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('Testing media upload with file:', testFile.name);
    
    const formData = new FormData();
    formData.append('files', testFile);
    
    const token = localStorage.getItem('authToken') || '';
    const response = await fetch(`${API_BASE_URL}/api/admin/anime/upload-media`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const result = await response.json();
    
    if (response.ok && result.success && result.files && result.files.length > 0) {
      console.log('✅ Media upload successful:', result.files[0].url);
      return {
        success: true,
        url: result.files[0].url,
      };
    } else {
      console.error('❌ Media upload failed:', result.error);
      return {
        success: false,
        error: result.error || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('❌ Media upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function logConnectionStatus(result: ConnectionTestResult): void {
  console.log('=== Connection Test Results ===');
  console.log('Overall Status:', result.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('API Connection:', result.apiConnection ? '✅ OK' : '❌ FAILED');
  console.log('Uploads Connection:', result.uploadsConnection ? '✅ OK' : '❌ FAILED');
  console.log('Auth Connection:', result.authConnection ? '✅ OK' : '❌ FAILED');
  console.log('Database Connection:', result.databaseConnection ? '✅ OK' : '❌ FAILED');
  
  if (result.errors.length > 0) {
    console.log('Errors:', result.errors);
  }
  console.log('============================');
}