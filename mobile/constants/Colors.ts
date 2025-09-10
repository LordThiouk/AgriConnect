/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  primary: '#3D944B',
  secondary: '#FFD65A',
  success: {
    light: '#E8F5E8',
    dark: '#3D944B',
  },
  warning: {
    light: '#FFF8E1',
    dark: '#FFD65A',
  },
  error: {
    light: '#FFEBEE',
    dark: '#FF6B6B',
  },
  info: '#4ECDC4',
  gray: {
    light: '#F5F5F5',
    medium: '#9E9E9E',
    dark: '#616161',
  },
  white: '#FFFFFF',
  black: '#000000',
  background: '#F6F6F6',
  text: {
    primary: '#212121',
    secondary: '#757575',
  },
};
