import { extendTheme } from 'native-base';

// Couleurs AgriConnect
const agriconnectColors = {
  primary: {
    50: '#f0f9f0',
    100: '#dcf2dc',
    200: '#bce5bc',
    300: '#8dd18d',
    400: '#5db85d',
    500: '#3D944B', // Couleur principale AgriConnect
    600: '#2f7a3a',
    700: '#25612e',
    800: '#1f4e26',
    900: '#1a4120',
  },
  secondary: {
    50: '#fffdf2',
    100: '#fffce6',
    200: '#fff8cc',
    300: '#fff2a3',
    400: '#FFD65A', // Couleur secondaire AgriConnect
    500: '#e6c047',
    600: '#d1a833',
    700: '#b89029',
    800: '#9a7425',
    900: '#7e5f24',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
};

// Configuration du thème AgriConnect
export const agriconnectTheme = extendTheme({
  colors: agriconnectColors,
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        solid: {
          bg: 'primary.500',
          _pressed: {
            bg: 'primary.600',
          },
        },
        outline: {
          borderColor: 'primary.500',
          borderWidth: 1,
          _text: {
            color: 'primary.500',
          },
          _pressed: {
            bg: 'primary.50',
          },
        },
      },
    },
    Input: {
      baseStyle: {
        bg: 'white',
        borderColor: 'gray.200',
        _focus: {
          borderColor: 'primary.500',
          bg: 'white',
        },
        _invalid: {
          borderColor: 'error.500',
        },
      },
    },
    FormControl: {
      baseStyle: {
        mb: 4,
      },
    },
    FormControlLabel: {
      baseStyle: {
        _text: {
          fontSize: 'md',
          fontWeight: 'semibold',
          color: 'gray.600',
        },
      },
    },
    Select: {
      baseStyle: {
        bg: 'white',
        borderColor: 'gray.200',
        _focus: {
          borderColor: 'primary.500',
        },
      },
    },
    Modal: {
      baseStyle: {
        bg: 'white',
        borderRadius: 'lg',
        p: 4,
      },
    },
    ModalHeader: {
      baseStyle: {
        _text: {
          fontSize: 'lg',
          fontWeight: 'bold',
          color: 'gray.800',
        },
      },
    },
  },
  config: {
    useSystemColorMode: false,
    initialColorMode: 'light',
  },
});

export type AgriConnectTheme = typeof agriconnectTheme;
