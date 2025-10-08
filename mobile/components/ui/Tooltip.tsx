import React from 'react';
import { Tooltip as NBTooltip, Box } from 'native-base';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right' | 'left top' | 'left bottom' | 'right top' | 'right bottom';
  hasArrow?: boolean;
  openDelay?: number;
  closeDelay?: number;
  shouldWrapChildren?: boolean;
  bg?: string;
  color?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  label,
  children,
  placement = 'top',
  hasArrow = true,
  openDelay = 500,
  closeDelay = 100,
  shouldWrapChildren = true,
  bg = 'gray.800',
  color = 'white',
}) => {
  return (
    <NBTooltip
      label={label}
      placement={placement}
      hasArrow={hasArrow}
      openDelay={openDelay}
      closeDelay={closeDelay}
      shouldWrapChildren={shouldWrapChildren}
      bg={bg}
      _text={{ color }}
    >
      {children}
    </NBTooltip>
  );
};
