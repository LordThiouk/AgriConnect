import { Database } from '../../../../types/database';
type Media = Database['public']['Tables']['media']['Row'];
// type MediaUpdate = Database['public']['Tables']['media']['Update'];

/**
 * Types pour le service des médias
 */

export interface MediaItem {
  id: string;
  created_at: string;
  updated_at: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  url: string;
  entity_type: 'plot' | 'crop' | 'operation' | 'observation' | 'producer' | 'agent';
  entity_id: string;
  owner_profile_id: string;
  metadata?: Record<string, any>;
  visit_id?: string | null;
  plot_id?: string | null;
  crop_id?: string | null;
  operation_id?: string | null;
  observation_id?: string | null;
  producer_id?: string | null;
}

export interface MediaDisplay extends Media {
  entity_name?: string;
  owner_name?: string;
}

// Représentation complète d'un média utilisable côté app (row + champs dérivés)
export type MediaFile = Media & {
  url?: string;
  gps_coordinates?: {
    lat: number;
    lon: number;
  };
};

export interface MediaFilters {
  entity_type?: 'plot' | 'crop' | 'operation' | 'observation' | 'producer' | 'agent';
  entity_id?: string;
  owner_profile_id?: string;
  mime_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface MediaSort {
  field: 'file_name' | 'mime_type' | 'created_at' | 'taken_at' | 'file_size_bytes';
  direction: 'asc' | 'desc';
}

export interface UploadMediaParams {
  file: File | Blob | ArrayBuffer | Uint8Array;
  entityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer' | 'agent';
  entityId: string;
  fileName: string;
  description?: string;
  tags?: string[];
  gpsCoordinates?: {
    lat: number;
    lon: number;
  };
  takenAt?: Date;
}

export interface MediaCreateData {
  owner_profile_id: string;
  entity_type: 'plot' | 'crop' | 'operation' | 'observation' | 'producer' | 'agent';
  entity_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes?: number;
  gps_coordinates?: {
    lat: number;
    lon: number;
  };
  taken_at?: string;
  description?: string;
  tags?: string[];
}

export interface MediaUpdateData {
  description?: string;
  tags?: string[];
  taken_at?: string;
  gps_coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface MediaCacheKey {
  entity: `media:${string}:${string}`; // entity_type:entity_id
  media: `media:${string}`;
  owner: `media:owner:${string}`;
}

export interface MediaServiceOptions {
  useCache?: boolean;
  cacheTTL?: number;
  refreshCache?: boolean;
}

export interface MediaUploadResponse {
  path: string;
  fullPath: string;
  signedUrl: string;
}

export interface MediaDeleteResponse {
  message: string;
}
