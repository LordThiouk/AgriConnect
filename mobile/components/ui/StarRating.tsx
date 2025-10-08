import React from 'react';
import { HStack, Pressable, Box, useTheme } from 'native-base';
import { Feather } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  starSize?: number;
  color?: string;
  disabled?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  starSize = 32,
  color = '#FFD65A',
  disabled = false,
}) => {
  const theme = useTheme();
  return (
    <HStack space={2} alignItems="center" justifyContent="center">
      {Array.from({ length: maxRating }, (_, index) => {
        const starNumber = index + 1;
        const isActive = starNumber <= rating;
        
        return (
          <Pressable
            key={starNumber}
            onPress={() => !disabled && onRatingChange(starNumber)}
            _pressed={{ opacity: 0.7 }}
            disabled={disabled}
          >
            <Box opacity={disabled ? 0.5 : 1}>
              <Feather
                name="star"
                size={starSize}
                color={isActive ? (color || theme.colors.yellow?.[400] || '#FFD65A') : (theme.colors.gray?.[300] || '#d1d5db')}
                fill={isActive ? (color || theme.colors.yellow?.[400] || '#FFD65A') : 'none'}
              />
            </Box>
          </Pressable>
        );
      })}
    </HStack>
  );
};
