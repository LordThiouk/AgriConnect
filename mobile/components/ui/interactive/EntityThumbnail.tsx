import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { Box, Pressable, Text } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import PhotoGallery from './PhotoGallery';
import { MediaService, MediaFile } from '../../../lib/services/media';

interface EntityThumbnailProps {
  entityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer';
  entityId: string;
  size?: number; // pixels, default 64
  borderRadius?: number; // default 12
}

const EntityThumbnail: React.FC<EntityThumbnailProps> = ({ entityType, entityId, size = 64, borderRadius = 12 }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const media: MediaFile[] = await MediaService.getMediaByEntity(entityType, entityId);
        if (mounted) {
          setThumbUrl(media[0]?.url || null);
        }
      } catch {
        if (mounted) setThumbUrl(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [entityType, entityId]);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} _pressed={{ opacity: 0.85 }}>
        <Box w={size} h={size} borderRadius={borderRadius} overflow="hidden" bg="gray.100" flexShrink={0} alignSelf="flex-start" alignItems="center" justifyContent="center">
          {thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={Math.max(14, Math.floor(size * 0.6))} color="#9ca3af" />
          )}
        </Box>
      </Pressable>

      {visible && (
        <PhotoGallery
          entityType={entityType}
          entityId={entityId}
          title=""
          maxPhotos={10}
          showTitle={false}
          isHeaderGallery={false}
          openImmediately
          modalOnly
          onClose={() => setVisible(false)}
        />
      )}
    </>
  );
};

export default React.memo(EntityThumbnail);


