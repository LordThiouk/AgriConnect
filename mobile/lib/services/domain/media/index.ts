export { MediaService } from '../../media';
export type { MediaFile, UploadMediaParams } from '../../media';
// Back-compat types for hooks that referenced domain-level options
export interface MediaServiceOptions {}
export const MediaCache = {} as any;
/**
 * Service de gestion des médias - AgriConnect
 * Extrait du MediaService avec intégration du cache intelligent
 */

export * from './media.service';
export * from './media.cache';
export * from './media.types';
