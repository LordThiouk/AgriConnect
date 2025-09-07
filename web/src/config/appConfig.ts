// Configuration de l'application AgriConnect

export const APP_CONFIG = {
  // Configuration des données
  USE_MOCK_DATA: false, // Changez à false pour utiliser Supabase
  
  // Configuration de la pagination
  DEFAULT_ITEMS_PER_PAGE: 20,
  MAX_ITEMS_PER_PAGE: 100,
  
  // Configuration des filtres
  SEARCH_DEBOUNCE_MS: 300,
  
  // Configuration des modals
  MODAL_ANIMATION_DURATION: 200,
  
  // Configuration des notifications
  NOTIFICATION_DURATION: 5000,
  
  // Configuration des exports
  EXPORT_FORMATS: ['csv', 'excel', 'pdf'] as const,
  
  // Configuration des régions (pour les filtres)
  REGIONS: [
    'Dakar',
    'Thiès', 
    'Diourbel',
    'Kaolack',
    'Fatick',
    'Saint-Louis',
    'Tambacounda',
    'Kolda',
    'Ziguinchor',
    'Matam'
  ],
  
  // Configuration des cultures
  CULTURES: [
    'Maïs',
    'Riz',
    'Arachide',
    'Millet',
    'Sorgho',
    'Coton',
    'Tomate',
    'Oignon',
    'Pomme de terre',
    'Mangue'
  ],
  
  // Configuration des statuts
  STATUS_OPTIONS: [
    { value: 'active', label: 'Actif', color: 'green' },
    { value: 'inactive', label: 'Inactif', color: 'red' }
  ]
} as const;

export type ExportFormat = typeof APP_CONFIG.EXPORT_FORMATS[number];
export type StatusOption = typeof APP_CONFIG.STATUS_OPTIONS[number];
