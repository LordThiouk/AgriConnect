// Constantes UI pour l'uniformité entre les pages
export const UI_CONSTANTS = {
  colors: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white',
    light: 'bg-gray-50 hover:bg-gray-100 text-gray-600',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white'
  },
  pagination: {
    primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondaryButton: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    disabledButton: 'bg-gray-100 text-gray-400 cursor-not-allowed',
    activeButton: 'bg-blue-600 text-white border border-blue-600'
  },
  badges: {
    active: 'bg-green-100 text-green-800 border border-green-200',
    inactive: 'bg-red-100 text-red-800 border border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    default: 'bg-gray-100 text-gray-800 border border-gray-200'
  },
  cards: {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    header: 'bg-gray-50 border-b border-gray-200 rounded-t-lg',
    content: 'p-4',
    footer: 'bg-gray-50 border-t border-gray-200 rounded-b-lg p-4'
  },
  buttons: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors',
    ghost: 'hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-md font-medium transition-colors',
    danger: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors'
  }
} as const;

export const PAGINATION_STYLES = {
  container: 'flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200',
  info: 'text-sm text-gray-700',
  navigation: 'flex items-center space-x-1',
  button: 'px-3 py-1 text-sm font-medium rounded-md transition-colors',
  buttonActive: `${UI_CONSTANTS.pagination.activeButton} px-3 py-1 text-sm font-medium rounded-md`,
  buttonDisabled: `${UI_CONSTANTS.pagination.disabledButton} px-3 py-1 text-sm font-medium rounded-md`,
  buttonDefault: `${UI_CONSTANTS.pagination.secondaryButton} px-3 py-1 text-sm font-medium rounded-md`
} as const;
