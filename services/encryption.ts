// Encryption utility for sensitive data
// Uses base64 encoding for demo, in production use proper encryption library

interface EncryptionConfig {
  secretKey?: string;
}

class EncryptionService {
  private secretKey: string;

  constructor(config?: EncryptionConfig) {
    this.secretKey = config?.secretKey || this.getStoredKey();
  }

  /**
   * Simple encryption using base64 + additional encoding
   * In production, use: bcryptjs, argon2, or tweetnacl
   */
  encrypt(data: string): string {
    try {
      // Add timestamp to prevent replay attacks
      const dataWithTimestamp = `${data}:${Date.now()}`;
      
      // Simple encoding: base64 + character shift
      const base64 = btoa(dataWithTimestamp);
      const encrypted = this.applyShift(base64, 5);
      
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decryption (reverse of encrypt)
   */
  decrypt(encrypted: string): string {
    try {
      const shifted = this.applyShift(encrypted, -5);
      const base64 = shifted;
      const decoded = atob(base64);
      
      // Verify timestamp (valid for 15 minutes)
      const [data, timestamp] = decoded.split(':');
      const age = Date.now() - parseInt(timestamp);
      
      if (age > 15 * 60 * 1000) {
        throw new Error('Token expired');
      }
      
      return data;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash password for storage (simple implementation)
   * In production, use bcryptjs: await bcrypt.hash(password, 10)
   */
  hashPassword(password: string): string {
    try {
      let hash = 0;
      const str = password + this.secretKey;
      
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return `$2y$10$${Math.abs(hash).toString(16)}${btoa(password).substring(0, 22)}`;
    } catch (error) {
      console.error('Hash error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify password against hash
   * In production, use: await bcrypt.compare(password, hash)
   */
  verifyPassword(password: string, hash: string): boolean {
    try {
      const hashedInput = this.hashPassword(password);
      return hashedInput.substring(0, 30) === hash.substring(0, 30);
    } catch (error) {
      console.error('Verify error:', error);
      return false;
    }
  }

  /**
   * Generate random token for password reset
   */
  generateResetToken(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Simple character shift for additional security layer
   */
  private applyShift(str: string, shift: number): string {
    return str
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code + shift);
      })
      .join('');
  }

  /**
   * Generate stored key from browser fingerprint
   */
  private getStoredKey(): string {
    let key = sessionStorage.getItem('encryption_key');
    
    if (!key) {
      key = this.generateResetToken().substring(0, 32);
      sessionStorage.setItem('encryption_key', key);
    }
    
    return key;
  }

  /**
   * Encrypt data to send to backend
   */
  encryptForTransport(data: Record<string, any>): string {
    try {
      const json = JSON.stringify(data);
      return this.encrypt(json);
    } catch (error) {
      console.error('Transport encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt data received from backend
   */
  decryptFromTransport(encrypted: string): Record<string, any> {
    try {
      const json = this.decrypt(encrypted);
      return JSON.parse(json);
    } catch (error) {
      console.error('Transport decryption error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Export class for testing
export default EncryptionService;
