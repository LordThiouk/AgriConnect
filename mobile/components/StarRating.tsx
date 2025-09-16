import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type StarRatingProps = {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  starSize?: number;
  color?: string;
};

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  starSize = 32,
  color = '#FFD65A',
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starNumber = index + 1;
        return (
          <TouchableOpacity
            key={starNumber}
            onPress={() => onRatingChange(starNumber)}
            activeOpacity={0.7}
          >
            <Feather
              name="star"
              size={starSize}
              style={[
                styles.star,
                { color: starNumber <= rating ? color : '#d1d5db' },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 4,
  },
});

export default StarRating;
