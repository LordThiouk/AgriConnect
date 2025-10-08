import React, { useRef } from 'react';
import { TextInput, Keyboard, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface KeyboardManagerProps {
  children: React.ReactNode;
  nextFieldRef?: React.RefObject<TextInput>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done' | 'search' | 'send' | 'go';
}

export const useKeyboardManager = () => {
  const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

  const registerInput = (key: string, ref: TextInput | null) => {
    inputRefs.current[key] = ref;
  };

  const focusNext = (currentKey: string, nextKey?: string) => {
    const currentInput = inputRefs.current[currentKey];
    const nextInput = nextKey ? inputRefs.current[nextKey] : null;

    if (currentInput && nextInput) {
      currentInput.blur();
      setTimeout(() => {
        nextInput.focus();
      }, 100);
    } else if (currentInput) {
      currentInput.blur();
      Keyboard.dismiss();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return {
    registerInput,
    focusNext,
    dismissKeyboard,
  };
};

export const KeyboardManager: React.FC<KeyboardManagerProps> = ({
  children,
}) => {
  useFocusEffect(
    React.useCallback(() => {
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          // Actions à effectuer quand le clavier se ferme
        }
      );

      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (event) => {
          // Actions à effectuer quand le clavier s'ouvre
          console.log('Keyboard height:', event.endCoordinates.height);
        }
      );

      return () => {
        keyboardDidHideListener?.remove();
        keyboardDidShowListener?.remove();
      };
    }, [])
  );

  return <>{children}</>;
};

// Hook pour gérer l'auto-focus des champs
export const useAutoFocus = (shouldFocus: boolean) => {
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (shouldFocus && inputRef.current && Platform.OS !== 'web') {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 300);

        return () => clearTimeout(timer);
      }
    }, [shouldFocus])
  );

  return inputRef;
};
