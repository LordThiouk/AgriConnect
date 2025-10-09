import React from 'react';
import { TextInput } from 'react-native';
import { Box } from 'native-base';

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
  // Style basé sur NativeBase mais avec TextInput natif
  const inputStyle = {
    borderWidth: 1,
    borderColor: '#E2E8F0', // gray.200
    borderRadius: 6,
    backgroundColor: 'white',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: multiline ? 60 : 42,
    textAlignVertical: multiline ? 'top' as const : 'center' as const,
    color: '#1A202C', // gray.800
    width: '100%' as const,
  };

  const placeholderTextColor = '#A0AEC0'; // gray.400

  return (
    <Box w="100%">
      <TextInput
        style={inputStyle}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        returnKeyType={returnKeyType || (multiline ? 'default' : 'next')}
        blurOnSubmit={blurOnSubmit !== undefined ? blurOnSubmit : false}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        onBlur={onBlur}
        selectTextOnFocus={selectTextOnFocus}
        clearButtonMode={clearButtonMode}
        maxLength={maxLength}
        autoFocus={autoFocus}
        textContentType={textContentType}
        // Props pour stabiliser le clavier
        focusable={true}
        disableFullscreenUI={true}
        showSoftInputOnFocus={true}
      />
    </Box>
  );
};
