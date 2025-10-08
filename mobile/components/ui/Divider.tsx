import React from 'react';
import { Divider as NBDivider } from 'native-base';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  margin?: number;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color = 'gray.300',
  margin = 4,
}) => {
  return (
    <NBDivider
      orientation={orientation}
      thickness={thickness}
      bg={color}
      my={orientation === 'horizontal' ? margin : 0}
      mx={orientation === 'vertical' ? margin : 0}
    />
  );
};
