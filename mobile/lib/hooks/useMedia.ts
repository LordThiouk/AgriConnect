/**
 * Hook pour la gestion des médias avec cache
 */

import { useCallback, useEffect, useState } from 'react';
import { useCache } from './useCache';
import { MediaService } from '../services/domain/media';
import { MediaCache } from '../services/domain/media';
import {
  MediaFile,
  MediaDisplay,
  UploadMediaParams,
  MediaUpdateData,
  MediaServiceOptions
} from '../services/domain/media';

export interface UseMediaOptions extends MediaServiceOptions {
  refetchOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: MediaFile[] | MediaFile) => void;
}

export interface UseMediaReturn {
  data: MediaFile[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  uploadMedia: (params: UploadMediaParams) => Promise<MediaFile | null>;
  deleteMedia: (id: string) => Promise<void>;
}

/**
 * Hook pour récupérer les médias d'une entité
 */
export const useMediaByEntity = (
  entityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer',
  entityId: string,
  options: UseMediaOptions = {}
): UseMediaReturn => {
  const [data, setData] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMedia = useCallback(async () => {
    if (!entityId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const media = await MediaService.getMediaByEntity(entityType, entityId, options);
      setData(media);
      options.onSuccess?.(media);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la récupération des médias');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, options]);

  useEffect(() => {
    if (options.refetchOnMount !== false) {
      fetchMedia();
    }
  }, [fetchMedia, options.refetchOnMount]);

  const uploadMedia = useCallback(async (params: UploadMediaParams): Promise<MediaFile | null> => {
    try {
      const newMedia = await MediaService.uploadMedia(params, options);
      
      // Rafraîchir les données après upload
      await fetchMedia();
      
      return newMedia;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de l\'upload du média');
      options.onError?.(error);
      return null;
    }
  }, [fetchMedia, options]);

  const deleteMedia = useCallback(async (id: string): Promise<void> => {
    try {
      await MediaService.deleteMedia(id, options);
      
      // Rafraîchir les données après suppression
      await fetchMedia();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la suppression du média');
      options.onError?.(error);
      throw error;
    }
  }, [fetchMedia, options]);

  return {
    data,
    loading,
    error,
    refetch: fetchMedia,
    uploadMedia,
    deleteMedia
  };
};

/**
 * Hook pour récupérer un média par son ID
 */
export const useMediaById = (
  mediaId: string,
  options: UseMediaOptions = {}
): {
  data: MediaFile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} => {
  const [data, setData] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMedia = useCallback(async () => {
    if (!mediaId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const media = await MediaService.getMediaById(mediaId, options);
      setData(media);
      options.onSuccess?.(media);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la récupération du média');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [mediaId, options]);

  useEffect(() => {
    if (options.refetchOnMount !== false) {
      fetchMedia();
    }
  }, [fetchMedia, options.refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch: fetchMedia
  };
};

/**
 * Hook pour uploader un média
 */
export const useUploadMedia = (
  options: UseMediaOptions = {}
): {
  uploadMedia: (params: UploadMediaParams) => Promise<MediaFile | null>;
  loading: boolean;
  error: Error | null;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadMedia = useCallback(async (params: UploadMediaParams): Promise<MediaFile | null> => {
    setLoading(true);
    setError(null);

    try {
      const newMedia = await MediaService.uploadMedia(params, options);
      options.onSuccess?.(newMedia);
      return newMedia;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de l\'upload du média');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    uploadMedia,
    loading,
    error
  };
};

/**
 * Hook pour supprimer un média
 */
export const useDeleteMedia = (
  options: UseMediaOptions = {}
): {
  deleteMedia: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteMedia = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await MediaService.deleteMedia(id, options);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la suppression du média');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    deleteMedia,
    loading,
    error
  };
};

/**
 * Hook pour générer une URL signée
 */
export const useSignedUrl = (): {
  getSignedUrl: (filePath: string, expiresIn?: number) => Promise<string | null>;
  loading: boolean;
  error: Error | null;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getSignedUrl = useCallback(async (filePath: string, expiresIn: number = 3600): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = await MediaService.getSignedUrl(filePath, expiresIn);
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la génération de l\'URL signée');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getSignedUrl,
    loading,
    error
  };
};

/**
 * Hook pour invalider le cache des médias
 */
export const useInvalidateMediaCache = () => {
  const invalidateEntityCache = useCallback(async (entityType: string, entityId: string) => {
    await MediaCache.invalidateEntityCache(entityType, entityId);
  }, []);

  const invalidateOwnerCache = useCallback(async (ownerId: string) => {
    await MediaCache.invalidateOwnerCache(ownerId);
  }, []);

  const invalidateAllCache = useCallback(async () => {
    await MediaCache.invalidateAllCache();
  }, []);

  return {
    invalidateEntityCache,
    invalidateOwnerCache,
    invalidateAllCache
  };
};
