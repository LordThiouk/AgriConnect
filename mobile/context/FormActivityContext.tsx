import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface FormActivityContextValue {
  isFormActive: boolean;
  setIsFormActive: (active: boolean) => void;
}

const FormActivityContext = createContext<FormActivityContextValue | undefined>(undefined);

export const FormActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFormActive, setIsFormActive] = useState(false);

  const wrappedSetIsFormActive = useCallback((active: boolean) => {
    console.log('🔄 [FormActivityContext] isFormActive changing:', active);
    setIsFormActive(active);
  }, []);

  const value = useMemo(() => ({ isFormActive, setIsFormActive: wrappedSetIsFormActive }), [isFormActive, wrappedSetIsFormActive]);

  return (
    <FormActivityContext.Provider value={value}>
      {children}
    </FormActivityContext.Provider>
  );
};

export const useFormActivity = (): FormActivityContextValue => {
  const ctx = useContext(FormActivityContext);
  if (!ctx) throw new Error('useFormActivity must be used within FormActivityProvider');
  return ctx;
};


