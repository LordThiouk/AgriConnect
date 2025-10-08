import React from 'react';
import { Input } from 'native-base';
import { FormField } from './FormField';
import { Platform } from 'react-native';

interface FormInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'decimal-pad' | 'number-pad';
  secureTextEntry?: boolean;
  disabled?: boolean;
  variant?: 'outline' | 'filled' | 'underlined' | 'rounded' | 'unstyled';
  returnKeyType?: 'done' | 'next' | 'search' | 'send' | 'go' | 'default';
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  selectTextOnFocus?: boolean;
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
  maxLength?: number;
  autoFocus?: boolean;
  blurOnSubmit?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  textContentType?: 'none' | 'username' | 'password' | 'newPassword' | 'oneTimeCode' | 'emailAddress' | 'telephoneNumber';
}

export const FormInput: React.FC<FormInputProps> = ({
  placeholder,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  disabled = false,
  variant = 'outline',
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
  selectTextOnFocus = false,
  clearButtonMode = 'never',
  maxLength,
  autoFocus = false,
  blurOnSubmit,
  autoCapitalize = 'sentences',
  autoCorrect = false,
  textContentType,
}) => {
  return (
    <Input
      variant="outline"
      size="md"
      minH={multiline ? 60 : 42}
      maxW="100%"
      isDisabled={disabled}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      textAlignVertical={multiline ? 'top' : 'center'}
      bg="white"
      fontSize="sm"
      px={3}
      py={2}
      returnKeyType={returnKeyType || (multiline ? 'default' : 'done')}
      blurOnSubmit={blurOnSubmit !== undefined ? blurOnSubmit : !multiline}
      autoCorrect={autoCorrect}
      autoCapitalize={autoCapitalize}
      autoComplete="off"
      w="100%"
      onSubmitEditing={onSubmitEditing}
      onFocus={onFocus}
      onBlur={onBlur}
      selectTextOnFocus={selectTextOnFocus}
      clearButtonMode={clearButtonMode}
      maxLength={maxLength}
      autoFocus={autoFocus}
      textContentType={textContentType}
      // Fix pour le clavier sur web
      {...(Platform.OS === 'web' && {
        focusable: true,
      })}
    />
  );
};
