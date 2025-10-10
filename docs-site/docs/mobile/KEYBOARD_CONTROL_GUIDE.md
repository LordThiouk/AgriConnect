# Guide de Contrôle du Clavier - AgriConnect

## Vue d'ensemble

Ce guide explique comment utiliser les composants et hooks de gestion du clavier dans l'application AgriConnect mobile.

## Composants Disponibles

### 1. FormContainer avec Support Clavier

Le `FormContainer` inclut maintenant un support automatique pour la gestion du clavier :

```tsx
import { FormContainer } from '../components/ui';

<FormContainer
  title="Nouvelle Observation"
  subtitle="Ajouter une observation"
  enableKeyboardAvoidance={true}        // Activer/désactiver
  keyboardVerticalOffset={0}            // Offset personnalisé
>
  {/* Contenu du formulaire */}
</FormContainer>
```

**Props disponibles :**
- `enableKeyboardAvoidance`: boolean (défaut: true)
- `keyboardVerticalOffset`: number (défaut: 0)

### 2. FormInput avec Contrôles Avancés

Le `FormInput` supporte maintenant tous les contrôles de clavier :

```tsx
import { FormInput } from '../components/ui';

<FormInput
  value={formData.name}
  onChangeText={(value) => setFormData({...formData, name: value})}
  placeholder="Nom du produit"
  
  // Contrôles clavier
  keyboardType="default"                // Type de clavier
  returnKeyType="next"                  // Type de touche retour
  autoFocus={false}                     // Focus automatique
  autoCapitalize="sentences"            // Capitalisation
  autoCorrect={false}                   // Correction automatique
  textContentType="none"                // Type de contenu (iOS)
  
  // Navigation entre champs
  onSubmitEditing={() => nextFieldRef.current?.focus()}
  onFocus={() => console.log('Field focused')}
  onBlur={() => console.log('Field blurred')}
  
  // Options avancées
  blurOnSubmit={true}                   // Fermer clavier après soumission
  selectTextOnFocus={false}             // Sélectionner tout au focus
  maxLength={100}                       // Limite de caractères
/>
```

### 3. FormTextArea pour Textes Longs

Composant spécialisé pour les zones de texte multilignes :

```tsx
import { FormTextArea } from '../components/ui';

<FormTextArea
  value={formData.description}
  onChangeText={(value) => setFormData({...formData, description: value})}
  placeholder="Description..."
  numberOfLines={4}
  maxLength={500}
/>
```

## Hooks de Gestion du Clavier

### 1. useKeyboardManager

Hook principal pour gérer la navigation entre champs :

```tsx
import { useKeyboardManager } from '../components/ui';

const MyForm = () => {
  const { registerInput, focusNext, dismissKeyboard } = useKeyboardManager();
  
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  
  useEffect(() => {
    registerInput('name', nameRef.current);
    registerInput('email', emailRef.current);
  }, []);
  
  return (
    <>
      <FormInput
        ref={nameRef}
        value={formData.name}
        onChangeText={(value) => setFormData({...formData, name: value})}
        onSubmitEditing={() => focusNext('name', 'email')}
        returnKeyType="next"
      />
      
      <FormInput
        ref={emailRef}
        value={formData.email}
        onChangeText={(value) => setFormData({...formData, email: value})}
        onSubmitEditing={() => dismissKeyboard()}
        returnKeyType="done"
      />
    </>
  );
};
```

### 2. useAutoFocus

Hook pour gérer le focus automatique :

```tsx
import { useAutoFocus } from '../components/ui';

const MyForm = () => {
  const firstFieldRef = useAutoFocus(true); // Focus automatique au montage
  
  return (
    <FormInput
      ref={firstFieldRef}
      value={formData.name}
      onChangeText={(value) => setFormData({...formData, name: value})}
      placeholder="Premier champ (focus automatique)"
    />
  );
};
```

### 3. KeyboardManager

Composant wrapper pour écouter les événements du clavier :

```tsx
import { KeyboardManager } from '../components/ui';

<KeyboardManager>
  {/* Contenu qui écoute les événements clavier */}
</KeyboardManager>
```

## Bonnes Pratiques

### 1. Navigation Entre Champs

```tsx
const formRefs = {
  name: useRef<TextInput>(null),
  email: useRef<TextInput>(null),
  phone: useRef<TextInput>(null),
};

// Navigation séquentielle
const handleNameSubmit = () => formRefs.email.current?.focus();
const handleEmailSubmit = () => formRefs.phone.current?.focus();
const handlePhoneSubmit = () => Keyboard.dismiss();

<FormInput
  ref={formRefs.name}
  onSubmitEditing={handleNameSubmit}
  returnKeyType="next"
/>

<FormInput
  ref={formRefs.email}
  onSubmitEditing={handleEmailSubmit}
  returnKeyType="next"
/>

<FormInput
  ref={formRefs.phone}
  onSubmitEditing={handlePhoneSubmit}
  returnKeyType="done"
/>
```

### 2. Types de Clavier Appropriés

```tsx
// Champs numériques
<FormInput keyboardType="numeric" />           // Nombres entiers
<FormInput keyboardType="decimal-pad" />       // Nombres décimaux
<FormInput keyboardType="phone-pad" />         // Téléphone

// Champs texte
<FormInput keyboardType="email-address" />     // Email
<FormInput keyboardType="default" />           // Texte général
<FormInput keyboardType="url" />               // URLs
```

### 3. Gestion des États

```tsx
const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

useEffect(() => {
  const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
    setIsKeyboardVisible(true);
  });
  
  const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
    setIsKeyboardVisible(false);
  });
  
  return () => {
    keyboardDidShow.remove();
    keyboardDidHide.remove();
  };
}, []);

// Adapter l'UI selon l'état du clavier
<FormContainer keyboardVerticalOffset={isKeyboardVisible ? 50: 0}>
  {/* Contenu */}
</FormContainer>
```

## Configuration par Plateforme

### iOS
- Utilise `behavior="padding"` pour KeyboardAvoidingView
- Support des `textContentType`
- Gestion automatique des animations

### Android
- Utilise `behavior="height"` pour KeyboardAvoidingView
- Support des `autoComplete`
- Gestion des touches système

### Web
- Utilise `focusable` au lieu de `autoFocus`
- Désactive certains comportements mobiles
- Support des raccourcis clavier

## Exemples Complets

### Formulaire avec Navigation Automatique

```tsx
import React, { useRef } from 'react';
import { FormContainer, FormInput, FormButton, FormFooter, useKeyboardManager } from '../components/ui';

const ContactForm = () => {
  const { registerInput, focusNext } = useKeyboardManager();
  
  const refs = {
    name: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    message: useRef<TextInput>(null),
  };
  
  useEffect(() => {
    Object.entries(refs).forEach(([key, ref]) => {
      registerInput(key, ref.current);
    });
  }, []);
  
  return (
    <FormContainer title="Contact" enableKeyboardAvoidance={true}>
      <FormInput
        ref={refs.name}
        placeholder="Nom complet"
        returnKeyType="next"
        onSubmitEditing={() => focusNext('name', 'email')}
      />
      
      <FormInput
        ref={refs.email}
        placeholder="Email"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => focusNext('email', 'message')}
      />
      
      <FormInput
        ref={refs.message}
        placeholder="Message"
        multiline
        numberOfLines={4}
        returnKeyType="done"
      />
      
      <FormFooter onCancel={() => {}} onSave={() => {}} />
    </FormContainer>
  );
};
```

## Dépannage

### Problèmes Courants

1. **Clavier qui ne s'ouvre pas**
   - Vérifier que `autoFocus={true}` est sur le premier champ
   - S'assurer que le composant est focusable sur web

2. **Navigation entre champs qui ne fonctionne pas**
   - Vérifier que les refs sont correctement assignés
   - S'assurer que `registerInput` est appelé

3. **Clavier qui ne se ferme pas**
   - Utiliser `Keyboard.dismiss()` dans `onSubmitEditing`
   - Vérifier que `blurOnSubmit={true}` est défini

4. **Problèmes de layout avec le clavier**
   - Ajuster `keyboardVerticalOffset`
   - Vérifier la configuration de `KeyboardAvoidingView`

### Debug

```tsx
// Activer les logs pour debug
const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
  const keyboardDidShow = Keyboard.addListener('keyboardDidShow', (event) => {
    console.log('Keyboard height:', event.endCoordinates.height);
    setKeyboardHeight(event.endCoordinates.height);
  });
  
  return () => keyboardDidShow.remove();
}, []);
```

## Conclusion

Le système de gestion du clavier d'AgriConnect offre une expérience utilisateur fluide et intuitive. Utilisez ces composants et hooks pour créer des formulaires performants et accessibles sur toutes les plateformes.
