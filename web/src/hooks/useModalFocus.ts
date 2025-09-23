import { useEffect } from 'react';

/**
 * Hook pour gérer le focus des modals et éviter les conflits aria-hidden
 */
export const useModalFocus = (isOpen: boolean) => {
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    if (isOpen) {
      // Utiliser inert pour empêcher le focus sur les éléments en arrière-plan
      // inert empêche à la fois la visibilité pour les technologies d'assistance ET la possibilité de focus
      rootElement.setAttribute('inert', '');
    } else {
      // Restaurer l'état normal
      rootElement.removeAttribute('inert');
    }

    // Cleanup function
    return () => {
      if (rootElement) {
        rootElement.removeAttribute('inert');
      }
    };
  }, [isOpen]);
};
