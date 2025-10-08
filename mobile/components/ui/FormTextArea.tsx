import React from 'react';
import { TextArea } from 'native-base';

interface FormTextAreaProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  numberOfLines?: number;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  placeholder,
  value,
  onChangeText,
  numberOfLines = 4,
  disabled = false,
  maxLength,
  autoFocus = false,
  onFocus,
  onBlur,
  onSubmitEditing,
}) => {
  return (
    <TextArea
      variant="outline"
      size="md"
      minH={numberOfLines * 20}
      maxW="100%"
      isDisabled={disabled}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      h={numberOfLines * 20}
      w="100%"
      bg="white"
      fontSize="sm"
      px={3}
      py={2}
      maxLength={maxLength}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      onSubmitEditing={onSubmitEditing}
      textAlignVertical="top"
      totalLines={numberOfLines}
    />
  );
};
