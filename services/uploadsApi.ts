/**
 * Uploads API Service - Anime.Su
 * Handles all file uploads to backend
 * Upload paths:
 * - AnimeSu/uploads/anime/animevideo/
 * - AnimeSu/uploads/anime/animeimg/
 * - AnimeSu/uploads/chat/
 * - AnimeSu/uploads/groups/
 * - AnimeSu/uploads/avatars/
 */

import { authApi } from './authApi';

const configuredUploadsUrl = ((import.meta as any).env?.VITE_API_URL || '/api')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');
const isLanClient = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);
const UPLOADS_BASE_URL = isLanClient && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredUploadsUrl)
  ? ''
  : configuredUploadsUrl;

export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
  };
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class UploadsApiService {
  private getUploadUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${UPLOADS_BASE_URL}/api${normalizedPath}`;
  }

  /**
   * Upload anime video
   * Path: /uploads/anime/animevideo/
   */
  async uploadAnimeVideo(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    return this.uploadFile('/uploads/anime/animevideo', file, onProgress);
  }

  /**
   * Upload anime image
   * Path: /uploads/anime/animeimg/
   */
  async uploadAnimeImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    return this.uploadFile('/uploads/anime/animeimg', file, onProgress);
  }

  /**
   * Upload chat image/file
   * Path: /uploads/chat/
   */
  async uploadChatFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    return this.uploadFile('/uploads/chat', file, onProgress);
  }

  /**
   * Upload group image
   * Path: /uploads/groups/
   */
  async uploadGroupImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    return this.uploadFile('/uploads/groups', file, onProgress);
  }

  /**
   * Upload user avatar
   * Path: /uploads/avatars/
   */
  async uploadAvatar(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    return this.uploadFile('/uploads/avatars', file, onProgress);
  }

  /**
   * Upload multiple anime images
   * Path: /uploads/anime/animeimg/
   */
  async uploadMultipleAnimeImages(
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => 
      this.uploadAnimeImage(file, onProgress)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Upload multiple anime videos
   * Path: /uploads/anime/animevideo/
   */
  async uploadMultipleAnimeVideos(
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => 
      this.uploadAnimeVideo(file, onProgress)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Generic file upload method
   */
  private async uploadFile(
    endpoint: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', Date.now().toString());

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentage = (e.loaded / e.total) * 100;
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage,
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                const uploadData = response.data || response;
                resolve({
                  success: true,
                  data: {
                    url: uploadData.url,
                    filename: uploadData.filename,
                    path: uploadData.path,
                    size: uploadData.size ?? file.size,
                    mimetype: uploadData.mimetype ?? file.type,
                  },
                });
              } else {
                resolve({
                  success: false,
                  error: response.error || 'Upload failed',
                });
              }
            } catch (error) {
              resolve({
                success: false,
                error: 'Invalid response from server',
              });
            }
          } else {
            resolve({
              success: false,
              error: `Upload failed with status ${xhr.status}`,
            });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: 'Network error during upload',
          });
        });

        xhr.open('POST', this.getUploadUrl(endpoint));
        
        // Add auth headers
        const authHeaders = authApi.getAuthHeaders();
        Object.entries(authHeaders).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(path: string): Promise<UploadResponse> {
    try {
      const response = await fetch(this.getUploadUrl('/uploads/delete'), {
        method: 'POST',
        headers: {
          ...authApi.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Delete failed',
        };
      }
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: 'Network error during delete',
      };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(path: string): Promise<UploadResponse> {
    try {
      const response = await fetch(this.getUploadUrl('/uploads/info'), {
        method: 'POST',
        headers: {
          ...authApi.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Get file info failed',
        };
      }
    } catch (error) {
      console.error('Get file info error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }
}

export const uploadsApi = new UploadsApiService();
