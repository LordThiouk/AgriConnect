# Guide de Migration vers le Nouveau Système de Composants - AgriConnect

## Vue d'ensemble

Ce guide explique comment migrer les écrans existants vers le nouveau système de composants AgriConnect basé sur NativeBase et le système de layout unifié.

## Architecture du Nouveau Système

### Structure des Composants

```
mobile/components/ui/
├── layout/               # Composants de layout
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Content.tsx
│   ├── Container.tsx
│   └── index.ts
├── navigation/           # Composants de navigation
│   ├── TabBar.tsx
│   ├── Breadcrumb.tsx
│   ├── BackButton.tsx
│   └── index.ts
├── interactive/          # Composants interactifs
│   ├── PhotoGallery.tsx
│   ├── CRUDList.tsx
│   ├── FilterModal.tsx
│   └── index.ts
├── forms/               # Composants de formulaire
│   ├── FormField.tsx
│   ├── FormInput.tsx
│   ├── FormSelect.tsx
│   ├── FormDatePicker.tsx
│   ├── FormButton.tsx
│   ├── FormFooter.tsx
│   └── FormContainer.tsx
└── index.ts            # Exports centralisés
```

## Plan de Migration

### Phase 1: Imports et Structure de Base

#### 1.1 Remplacer les imports React Native

```tsx
// ❌ Ancien import
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

// ✅ Nouveau import
import { Box, Text, Pressable, ScrollView } from 'native-base';
```

#### 1.2 Remplacer les composants de layout

```tsx
// ❌ Ancien layout
import HeaderGlobal from '../components/HeaderGlobal';
import ContentWithHeader from '../components/ContentWithHeader';

// ✅ Nouveau layout
import { ScreenContainer, LayoutFormContainer } from '../components/ui';
```

### Phase 2: Migration des Écrans

#### 2.1 Écran Principal (Dashboard)

```tsx
// ❌ Ancien écran
const DashboardScreen = () => {
  return (
    <View style={styles.container}>
      <HeaderGlobal title="Tableau de Bord" />
      <ContentWithHeader>
        <ScrollView>
          {/* Contenu */}
        </ScrollView>
      </ContentWithHeader>
    </View>
  );
};

// ✅ Nouvel écran
import { ScreenContainer, VStack, Card } from '../components/ui';

const DashboardScreen = () => {
  return (
    <ScreenContainer
      title="Tableau de Bord"
      subtitle="Vue d'ensemble des activités"
      showBackButton={false}
      showProfileButton={true}
      showNotifications={true}
    >
      <VStack space={4}>
        <Card>
          {/* Contenu */}
        </Card>
      </VStack>
    </ScreenContainer>
  );
};
```

#### 2.2 Écran de Formulaire

```tsx
// ❌ Ancien formulaire
const CreateFormScreen = () => {
  return (
    <View style={styles.container}>
      <HeaderGlobal title="Nouveau Formulaire" showBackButton={true} />
      <ContentWithHeader>
        <ScrollView>
          <View style={styles.form}>
            {/* Champs */}
          </View>
        </ScrollView>
      </ContentWithHeader>
      <View style={styles.footer}>
        <TouchableOpacity onPress={onCancel}>
          <Text>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSave}>
          <Text>Sauvegarder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ✅ Nouveau formulaire
import { LayoutFormContainer, FormField, FormInput, FormSelect } from '../components/ui';

const CreateFormScreen = () => {
  return (
    <LayoutFormContainer
      title="Nouveau Formulaire"
      subtitle="Remplissez les informations"
      showBackButton={true}
      onCancel={() => router.back()}
      onSave={handleSave}
      loading={isLoading}
    >
      <FormField label="Titre" required>
        <FormInput
          value={formData.title}
          onChangeText={(value) => setFormData({ ...formData, title: value })}
          placeholder="Entrez le titre"
        />
      </FormField>
      
      <FormField label="Type">
        <FormSelect
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          options={typeOptions}
          placeholder="Sélectionner un type"
        />
      </FormField>
    </LayoutFormContainer>
  );
};
```

#### 2.3 Écran de Liste

```tsx
// ❌ Ancienne liste
const ListScreen = () => {
  return (
    <View style={styles.container}>
      <HeaderGlobal title="Ma Liste" showBackButton={true} />
      <ContentWithHeader>
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onItemPress(item)}>
              <Text>{item.title}</Text>
              <Text>{item.subtitle}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </ContentWithHeader>
    </View>
  );
};

// ✅ Nouvelle liste
import { CRUDList } from '../components/ui';

const ListScreen = () => {
  return (
    <CRUDList
      title="Ma Liste"
      items={items}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onAdd={() => router.push('/add')}
      addButtonText="Ajouter un élément"
      emptyMessage="Aucun élément trouvé"
    />
  );
};
```

### Phase 3: Migration des Composants Spécialisés

#### 3.1 PhotoGallery

```tsx
// ❌ Ancien import
import PhotoGallery from '../components/PhotoGallery';

// ✅ Nouvel import
import { PhotoGallery } from '../components/ui';

// Usage reste identique
<PhotoGallery
  entityType="plot"
  entityId={plotId}
  title="Photos de la parcelle"
  maxPhotos={10}
  showTitle={true}
  isHeaderGallery={false}
/>
```

#### 3.2 CRUDList

```tsx
// ❌ Ancien import
import { CRUDList } from '../components/CRUDList';

// ✅ Nouvel import
import { CRUDList, SimpleCRUDList, CompactCRUDList } from '../components/ui';

// Usage avec nouvelles options
<CRUDList
  title="Mes Éléments"
  items={items}
  loading={isLoading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onAdd={handleAdd}
  onRefresh={handleRefresh}
  variant="card" // 'default' | 'compact' | 'card'
  showActions={true}
  showAddButton={true}
  showRefreshButton={true}
/>
```

#### 3.3 FilterModal

```tsx
// ❌ Ancien import
import VisitFilterModal from '../components/VisitFilterModal';

// ✅ Nouvel import
import { FilterModal, SimpleFilterModal } from '../components/ui';

// Usage avec nouvelles options
<FilterModal
  visible={showFilter}
  title="Filtrer les visites"
  options={filterOptions}
  currentFilter={currentFilter}
  onFilterSelect={handleFilterSelect}
  onClose={() => setShowFilter(false)}
  variant="default" // 'default' | 'compact' | 'grid'
  showCounts={true}
  showResetButton={true}
/>
```

### Phase 4: Migration des Styles

#### 4.1 Remplacer les StyleSheet

```tsx
// ❌ Ancien style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#3D944B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

// ✅ Nouveau style avec NativeBase
<Box
  flex={1}
  bg="gray.50"
  p={4}
>
  <Text
    fontSize="lg"
    fontWeight="bold"
    color="gray.800"
    mb={2}
  >
    Titre
  </Text>
  <Button
    bg="primary.500"
    p={3}
    borderRadius="md"
    _pressed={{ bg: 'primary.600' }}
  >
    Action
  </Button>
</Box>
```

#### 4.2 Utiliser le système de couleurs

```tsx
// ❌ Couleurs codées en dur
backgroundColor: '#3D944B'
color: '#FFD65A'

// ✅ Couleurs du thème AgriConnect
bg="primary.500"
color="secondary.400"
```

### Phase 5: Migration des Navigation

#### 5.1 BackButton

```tsx
// ❌ Ancien bouton retour
<TouchableOpacity onPress={() => router.back()}>
  <Ionicons name="arrow-back" size={24} color="white" />
</TouchableOpacity>

// ✅ Nouveau bouton retour
import { HeaderBackButton } from '../components/ui';

<HeaderBackButton
  onPress={() => router.back()}
  color="white"
  size="md"
/>
```

#### 5.2 TabBar

```tsx
// ❌ Ancienne TabBar
<View style={styles.tabBar}>
  {tabs.map(tab => (
    <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)}>
      <Text>{tab.label}</Text>
    </TouchableOpacity>
  ))}
</View>

// ✅ Nouvelle TabBar
import { TabBar } from '../components/ui';

<TabBar
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="default" // 'default' | 'compact' | 'vertical'
  showLabels={true}
  position="bottom" // 'top' | 'bottom'
/>
```

### Phase 6: Migration des Formulaires

#### 6.1 FormField et FormInput

```tsx
// ❌ Ancien champ de saisie
<View style={styles.field}>
  <Text style={styles.label}>Titre *</Text>
  <TextInput
    style={styles.input}
    value={title}
    onChangeText={setTitle}
    placeholder="Entrez le titre"
  />
</View>

// ✅ Nouveau champ de saisie
import { FormField, FormInput } from '../components/ui';

<FormField label="Titre" required>
  <FormInput
    value={title}
    onChangeText={setTitle}
    placeholder="Entrez le titre"
    keyboardType="default"
    autoCapitalize="sentences"
  />
</FormField>
```

#### 6.2 FormSelect

```tsx
// ❌ Ancien select
<View style={styles.field}>
  <Text style={styles.label}>Type</Text>
  <TouchableOpacity onPress={() => setShowModal(true)}>
    <Text>{selectedType || 'Sélectionner un type'}</Text>
  </TouchableOpacity>
</View>

// ✅ Nouveau select
import { FormSelect } from '../components/ui';

<FormField label="Type">
  <FormSelect
    value={selectedType}
    onValueChange={setSelectedType}
    options={typeOptions}
    placeholder="Sélectionner un type"
  />
</FormField>
```

### Phase 7: Migration des Modales

#### 7.1 Modal simple

```tsx
// ❌ Ancienne modale
<Modal visible={visible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modal}>
      <Text>Contenu de la modale</Text>
      <TouchableOpacity onPress={onClose}>
        <Text>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

// ✅ Nouvelle modale
import { ModalContainer } from '../components/ui';

<ModalContainer
  visible={visible}
  onClose={onClose}
  maxWidth="90%"
  maxHeight="80%"
>
  <Text>Contenu de la modale</Text>
</ModalContainer>
```

### Phase 8: Migration des États et Logique

#### 8.1 Gestion des états de chargement

```tsx
// ❌ Ancien état de chargement
const [loading, setLoading] = useState(false);

<View style={styles.container}>
  {loading && <ActivityIndicator />}
  {/* Contenu */}
</View>

// ✅ Nouvel état de chargement
import { Spinner } from 'native-base';

const [loading, setLoading] = useState(false);

<Box flex={1}>
  {loading && (
    <HStack justifyContent="center" p={4}>
      <Spinner size="lg" color="primary.500" />
      <Text ml={2}>Chargement...</Text>
    </HStack>
  )}
  {/* Contenu */}
</Box>
```

#### 8.2 Gestion des erreurs

```tsx
// ❌ Ancienne gestion d'erreur
const [error, setError] = useState(null);

{error && <Text style={styles.error}>{error}</Text>}

// ✅ Nouvelle gestion d'erreur
import { Alert } from '../components/ui';

const [error, setError] = useState(null);

{error && (
  <Alert
    status="error"
    title="Erreur"
    description={error}
    onClose={() => setError(null)}
  />
)}
```

## Checklist de Migration

### ✅ Avant la migration
- [ ] Sauvegarder le code existant
- [ ] Identifier tous les composants à migrer
- [ ] Planifier l'ordre de migration
- [ ] Tester l'application actuelle

### ✅ Pendant la migration
- [ ] Remplacer les imports React Native par NativeBase
- [ ] Utiliser les nouveaux composants de layout
- [ ] Migrer les formulaires vers FormField/FormInput
- [ ] Remplacer les styles par les props NativeBase
- [ ] Utiliser le système de couleurs du thème
- [ ] Tester chaque écran migré

### ✅ Après la migration
- [ ] Vérifier que tous les écrans fonctionnent
- [ ] Tester la navigation
- [ ] Vérifier la cohérence visuelle
- [ ] Optimiser les performances
- [ ] Documenter les changements

## Bonnes Pratiques

### 1. Migration Progressive
- Commencer par les écrans les plus simples
- Migrer un écran à la fois
- Tester après chaque migration

### 2. Réutilisation des Composants
- Utiliser les composants existants avant d'en créer de nouveaux
- Respecter le système de design
- Maintenir la cohérence visuelle

### 3. Performance
- Utiliser les composants optimisés (FlatList, etc.)
- Éviter les re-renders inutiles
- Optimiser les images et médias

### 4. Accessibilité
- Maintenir les labels et descriptions
- Utiliser les composants accessibles
- Tester avec les lecteurs d'écran

## Dépannage

### Problèmes Courants

1. **Import non trouvé**
   ```tsx
   // Vérifier que le composant est exporté dans ui/index.ts
   export { ComponentName } from './path/to/component';
   ```

2. **Styles non appliqués**
   ```tsx
   // Vérifier que le thème est appliqué dans _layout.tsx
   <NativeBaseProvider theme={agriconnectTheme}>
   ```

3. **Navigation cassée**
   ```tsx
   // Vérifier que les routes sont correctes
   router.push('/(tabs)/screen-name');
   ```

4. **Composants non rendus**
   ```tsx
   // Vérifier que les props sont correctes
   <ComponentName prop1={value1} prop2={value2} />
   ```

## Conclusion

La migration vers le nouveau système de composants AgriConnect améliore la maintenabilité, la cohérence visuelle et l'expérience utilisateur. Suivez ce guide étape par étape pour une migration réussie.

Pour plus d'informations, consultez :
- [Guide du Système de Layout](./LAYOUT_SYSTEM_GUIDE.md)
- [Guide des Composants UI](./UI_COMPONENTS_GUIDE.md)
- [Guide du Système de Design](./DESIGN_SYSTEM.md)
