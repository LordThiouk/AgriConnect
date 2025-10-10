# Guide du Système de Layout - AgriConnect

## Vue d'ensemble

Le système de layout AgriConnect fournit des composants standardisés et réutilisables pour créer des interfaces cohérentes et maintenables. Il est basé sur NativeBase et respecte le thème AgriConnect.

## Architecture du Système

### Structure des Composants

```
mobile/components/ui/layout/
├── Header.tsx          # Header principal avec navigation
├── Footer.tsx          # Footer avec actions
├── Content.tsx         # Zone de contenu avec scroll
├── Container.tsx       # Conteneur principal
└── index.ts           # Exports centralisés
```

### Hiérarchie des Composants

```
Container
├── Header (optionnel)
├── Content
│   └── Contenu principal
└── Footer (optionnel)
```

## Composants Disponibles

### 1. Container - Conteneur Principal

Le composant `Container` est la base de tous les layouts. Il gère la structure générale et peut inclure header, content et footer.

```tsx
import { Container } from '../components/ui';

<Container
  variant="fullscreen"           // fullscreen | centered | sidebar | modal
  backgroundColor="gray.50"      // Couleur de fond
  padding={0}                    // Padding global
  safeArea={true}               // Support safe area
  header={{                     // Configuration du header
    title: "Mon Écran",
    subtitle: "Description",
    showBackButton: true,
    showProfileButton: true,
    showNotifications: true,
  }}
  footer={{                     // Configuration du footer
    actions: [
      { label: "Annuler", onPress: onCancel, variant: "secondary" },
      { label: "Sauvegarder", onPress: onSave, variant: "primary" }
    ],
    loading: false,
    variant: "default"          // default | fixed | floating
  }}
  content={{                    // Configuration du content
    padding: 5,
    scrollable: true,
    backgroundColor: "white"
  }}
>
  {/* Contenu principal */}
</Container>
```

#### Variants du Container

- **`fullscreen`** : Écran pleine page (défaut)
- **`centered`** : Contenu centré
- **`sidebar`** : Layout avec sidebar
- **`modal`** : Modal avec overlay

### 2. Header - En-tête

Le composant `Header` fournit une barre de navigation standardisée avec titre, boutons d'action et notifications.

```tsx
import { Header } from '../components/ui';

<Header
  title="AgriConnect"                    // Titre principal
  subtitle="Tableau de bord"             // Sous-titre optionnel
  showBackButton={true}                  // Bouton retour
  showProfileButton={true}               // Bouton profil
  showNotifications={true}               // Bouton notifications
  onBackPress={() => router.back()}      // Action retour
  onProfilePress={() => router.push('/profile')} // Action profil
  onNotificationsPress={() => {}}        // Action notifications
  actions={<Button>Action</Button>}      // Actions personnalisées
  variant="primary"                      // primary | secondary | transparent
/>
```

#### Variants du Header

- **`primary`** : Fond vert AgriConnect (défaut)
- **`secondary`** : Fond jaune AgriConnect
- **`transparent`** : Fond transparent

### 3. Footer - Pied de page

Le composant `Footer` gère les actions en bas de l'écran avec différents styles et positions.

```tsx
import { Footer, SimpleFooter } from '../components/ui';

// Footer complet
<Footer
  actions={[
    {
      label: "Annuler",
      onPress: onCancel,
      variant: "secondary",
      loading: false,
      disabled: false
    },
    {
      label: "Sauvegarder",
      onPress: onSave,
      variant: "primary",
      loading: false,
      icon: <Feather name="check" size={16} color="white" />
    }
  ]}
  loading={false}
  variant="default"              // default | fixed | floating
  backgroundColor="white"
  showDivider={true}
  padding={5}
/>

// Footer simple
<SimpleFooter
  onCancel={() => {}}
  onSave={() => {}}
  onDelete={() => {}}
  cancelText="Annuler"
  saveText="Sauvegarder"
  deleteText="Supprimer"
  loading={false}
  showDelete={false}
  variant="default"
/>
```

#### Variants du Footer

- **`default`** : Position relative
- **`fixed`** : Position fixe en bas
- **`floating`** : Position flottante avec ombre

### 4. Content - Zone de contenu

Le composant `Content` gère la zone principale avec scroll et espacement automatique.

```tsx
import { Content, SimpleContent, FormContent, ListContent } from '../components/ui';

// Content complet
<Content
  padding={5}                           // Padding global
  paddingTop={10}                       // Padding top spécifique
  paddingBottom={5}                     // Padding bottom spécifique
  paddingHorizontal={4}                 // Padding horizontal
  paddingVertical={3}                   // Padding vertical
  scrollable={true}                     // Scroll activé
  keyboardShouldPersistTaps="handled"   // Gestion clavier
  showsVerticalScrollIndicator={false}  // Indicateur de scroll
  backgroundColor="gray.50"             // Couleur de fond
  space={4}                             // Espacement entre enfants
  alignItems="stretch"                  // Alignement des enfants
  justifyContent="flex-start"           // Justification des enfants
>
  {/* Contenu */}
</Content>

// Content simple
<SimpleContent
  padding={5}
  scrollable={true}
  backgroundColor="gray.50"
>
  {/* Contenu */}
</SimpleContent>

// Content pour formulaires
<FormContent
  padding={5}
  space={4}
>
  {/* Champs de formulaire */}
</FormContent>

// Content pour listes
<ListContent
  padding={4}
  space={2}
>
  {/* Éléments de liste */}
</ListContent>
```

## Composants Spécialisés

### ScreenContainer - Container pour écrans

Container optimisé pour les écrans principaux avec header et footer intégrés.

```tsx
import { ScreenContainer } from '../components/ui';

<ScreenContainer
  title="Mon Écran"
  subtitle="Description de l'écran"
  showBackButton={true}
  showProfileButton={true}
  showNotifications={true}
  onBackPress={() => router.back()}
  footerActions={[
    { label: "Annuler", onPress: onCancel, variant: "secondary" },
    { label: "Sauvegarder", onPress: onSave, variant: "primary" }
  ]}
  footerLoading={false}
  contentPadding={5}
  contentScrollable={true}
>
  {/* Contenu de l'écran */}
</ScreenContainer>
```

### FormContainer - Container pour formulaires

Container optimisé pour les formulaires avec gestion du clavier et footer d'actions.

```tsx
import { LayoutFormContainer } from '../components/ui';

<LayoutFormContainer
  title="Nouveau Formulaire"
  subtitle="Remplissez les informations"
  showBackButton={true}
  onBackPress={() => router.back()}
  onCancel={() => router.back()}
  onSave={handleSave}
  onDelete={handleDelete}
  cancelText="Annuler"
  saveText="Enregistrer"
  deleteText="Supprimer"
  loading={false}
  showDelete={false}
  contentPadding={5}
>
  {/* Champs du formulaire */}
</LayoutFormContainer>
```

### ModalContainer - Container pour modales

Container pour les modales avec overlay et centrage.

```tsx
import { ModalContainer } from '../components/ui';

<ModalContainer
  onClose={() => setVisible(false)}
  backgroundColor="rgba(0,0,0,0.5)"
  maxWidth="90%"
  maxHeight="80%"
>
  {/* Contenu de la modale */}
</ModalContainer>
```

## Patterns d'Utilisation

### 1. Écran Principal avec Navigation

```tsx
import { ScreenContainer } from '../components/ui';

const DashboardScreen = () => {
  return (
    <ScreenContainer
      title="Tableau de Bord"
      subtitle="Vue d'ensemble des activités"
      showBackButton={false}
      showProfileButton={true}
      showNotifications={true}
    >
      {/* Contenu du dashboard */}
    </ScreenContainer>
  );
};
```

### 2. Formulaire de Création

```tsx
import { LayoutFormContainer } from '../components/ui';

const CreateFormScreen = () => {
  const handleSave = () => {
    // Logique de sauvegarde
  };

  return (
    <LayoutFormContainer
      title="Nouvel Élément"
      subtitle="Ajouter un nouvel élément"
      showBackButton={true}
      onCancel={() => router.back()}
      onSave={handleSave}
      loading={isLoading}
    >
      {/* Champs du formulaire */}
    </LayoutFormContainer>
  );
};
```

### 3. Liste avec Actions

```tsx
import { Container, Header, ListContent, Footer } from '../components/ui';

const ListScreen = () => {
  return (
    <Container
      header={{
        title: "Ma Liste",
        showBackButton: true,
        actions: <Button variant="outline">Filtrer</Button>
      }}
      footer={{
        actions: [
          { label: "Actualiser", onPress: refresh, variant: "outline" },
          { label: "Ajouter", onPress: addItem, variant: "primary" }
        ]
      }}
      content={{
        scrollable: true,
        backgroundColor: "white"
      }}
    >
      {/* Éléments de la liste */}
    </Container>
  );
};
```

### 4. Modale de Confirmation

```tsx
import { ModalContainer, SimpleFooter } from '../components/ui';

const ConfirmModal = ({ visible, onClose, onConfirm }) => {
  if (!visible) return null;

  return (
    <ModalContainer onClose={onClose}>
      <Text>Êtes-vous sûr de vouloir supprimer cet élément ?</Text>
      <SimpleFooter
        onCancel={onClose}
        onSave={onConfirm}
        cancelText="Annuler"
        saveText="Supprimer"
        variant="floating"
      />
    </ModalContainer>
  );
};
```

## Gestion du Clavier

Le système de layout intègre automatiquement la gestion du clavier :

```tsx
<Container
  content={{
    scrollable: true,
    keyboardShouldPersistTaps: "handled", // Gestion des taps
    showsVerticalScrollIndicator: false    // Masquer l'indicateur
  }}
>
  {/* Formulaire avec champs */}
</Container>
```

## Responsive Design

Le système s'adapte automatiquement aux différentes tailles d'écran :

```tsx
<Container
  content={{
    padding: { base: 4, md: 6, lg: 8 }, // Padding responsive
    space: { base: 2, md: 4, lg: 6 }    // Espacement responsive
  }}
>
  {/* Contenu adaptatif */}
</Container>
```

## Thème AgriConnect

Tous les composants respectent automatiquement le thème AgriConnect :

- **Couleurs** : `primary.500`, `secondary.400`, `gray.50`, etc.
- **Typographie** : Tailles et poids standardisés
- **Espacements** : Valeurs cohérentes (4, 8, 16, 24, 32px)
- **Ombres** : Niveaux d'ombre standardisés

## Bonnes Pratiques

### 1. Structure Hiérarchique

```tsx
// ✅ Bonne structure
<ScreenContainer title="Mon Écran">
  <VStack space={4}>
    <Card>
      <Text>Titre de section</Text>
      <Text>Contenu de la section</Text>
    </Card>
  </VStack>
</ScreenContainer>

// ❌ Structure à éviter
<View>
  <View>
    <Text>Titre</Text>
    <View>
      <Text>Contenu</Text>
    </View>
  </View>
</View>
```

### 2. Gestion des États

```tsx
// ✅ Gestion d'état dans le container
<LayoutFormContainer
  loading={isLoading}
  footerActions={[
    { 
      label: "Sauvegarder", 
      onPress: handleSave, 
      loading: isSaving,
      disabled: !isValid 
    }
  ]}
>
  {/* Formulaire */}
</LayoutFormContainer>
```

### 3. Navigation Cohérente

```tsx
// ✅ Navigation standardisée
<Header
  showBackButton={true}
  onBackPress={() => router.back()}
  showProfileButton={true}
  onProfilePress={() => router.push('/profile')}
/>
```

## Dépannage

### Problèmes Courants

1. **Header qui ne s'affiche pas**
   - Vérifier que `title` est fourni
   - S'assurer que le variant est correct

2. **Footer qui ne s'affiche pas**
   - Vérifier que `actions` est un tableau non vide
   - S'assurer que les actions ont `label` et `onPress`

3. **Content qui ne scroll pas**
   - Vérifier que `scrollable={true}`
   - S'assurer que le contenu dépasse la hauteur disponible

4. **Espacement incorrect**
   - Vérifier les valeurs de `padding` et `space`
   - S'assurer que les composants enfants respectent la structure

### Debug

```tsx
// Activer les logs pour debug
<Container
  content={{
    backgroundColor: "red.100", // Couleur de debug
    padding: 5
  }}
>
  {/* Contenu avec bordure de debug */}
</Container>
```

## Conclusion

Le système de layout AgriConnect fournit une base solide et cohérente pour créer des interfaces utilisateur maintenables. Utilisez ces composants pour assurer la cohérence visuelle et fonctionnelle de l'application.

Pour plus d'informations, consultez :
- [Guide des Composants UI](mobile/overview.md)
- [Guide du Système de Design](mobile/overview.md)
- [Guide de Migration](development/guide.md)
