# 🤝 Guide de Contribution

Comment contribuer au projet AgriConnect.

## 🎯 Vue d'ensemble

AgriConnect est un projet open source qui accueille les contributions de la communauté. Ce guide vous explique comment contribuer efficacement.

## 🚀 Démarrage Rapide

### 1. Fork et Clone

```bash
# Fork le repository sur GitHub
# Puis cloner votre fork
git clone https://github.com/votre-username/agriconnect.git
cd agriconnect

# Ajouter le repository original comme remote
git remote add upstream https://github.com/agriconnect/agriconnect.git
```

### 2. Installation

```bash
# Installer les dépendances
npm run install:all

# Configurer l'environnement
cp env.example .env
# Éditer .env avec vos credentials
```

### 3. Créer une branche

```bash
# Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# Ou une branche fix
git checkout -b fix/correction-bug
```

## 📋 Types de Contributions

### 🐛 Corrections de Bugs

1. **Identifier le problème**
   - Vérifier les issues existantes
   - Créer une issue si nécessaire
   - Reproduire le bug localement

2. **Corriger le bug**
   - Écrire des tests pour reproduire le bug
   - Implémenter la correction
   - Vérifier que les tests passent

3. **Soumettre la correction**
   - Créer une Pull Request
   - Décrire le problème et la solution
   - Référencer l'issue liée

### ✨ Nouvelles Fonctionnalités

1. **Proposer la fonctionnalité**
   - Créer une issue pour discuter
   - Attendre l'approbation de l'équipe
   - Planifier l'implémentation

2. **Implémenter**
   - Créer une branche feature
   - Écrire des tests
   - Implémenter la fonctionnalité
   - Mettre à jour la documentation

3. **Soumettre**
   - Créer une Pull Request
   - Décrire la fonctionnalité
   - Inclure des captures d'écran si applicable

### 📚 Documentation

1. **Identifier les améliorations**
   - Documentation manquante
   - Exemples insuffisants
   - Erreurs dans la documentation

2. **Améliorer**
   - Corriger les erreurs
   - Ajouter des exemples
   - Améliorer la clarté

3. **Soumettre**
   - Créer une Pull Request
   - Décrire les améliorations

## 🔧 Standards de Code

### TypeScript

```typescript
// ✅ Bon
interface Producer {
  id: string;
  name: string;
  phone: string;
  cooperativeId: string;
}

const createProducer = async (data: CreateProducerData): Promise<Producer> => {
  // Implementation
};

// ❌ Éviter
const createProducer = async (data: any): Promise<any> => {
  // Implementation
};
```

### React/React Native

```typescript
// ✅ Bon
const ProducerCard = React.memo(({ producer, onPress }: ProducerCardProps) => {
  const handlePress = useCallback(() => {
    onPress?.(producer);
  }, [producer, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{producer.name}</Text>
    </TouchableOpacity>
  );
});

// ❌ Éviter
const ProducerCard = ({ producer, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(producer)}>
      <Text>{producer.name}</Text>
    </TouchableOpacity>
  );
};
```

### Nommage

- **Composants** : PascalCase (`ProducerCard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useProducer.ts`)
- **Services** : camelCase (`producerService.ts`)
- **Types** : PascalCase (`Producer.ts`)
- **Constantes** : UPPER_SNAKE_CASE (`API_BASE_URL`)

## 🧪 Tests

### Tests Obligatoires

```typescript
// Chaque composant doit avoir des tests
describe('ProducerCard', () => {
  it('should render producer name', () => {
    const producer = { id: '1', name: 'Mamadou Diallo' };
    render(<ProducerCard producer={producer} />);
    expect(screen.getByText('Mamadou Diallo')).toBeOnTheScreen();
  });
});

// Chaque service doit avoir des tests
describe('producerService', () => {
  it('should create a producer', async () => {
    const result = await createProducer(mockData);
    expect(result).toBeDefined();
  });
});
```

### Couverture de Code

- **Minimum** : 80% de couverture
- **Tests unitaires** : Obligatoires
- **Tests d'intégration** : Recommandés
- **Tests E2E** : Pour les fonctionnalités critiques

## 📝 Documentation

### Commentaires de Code

```typescript
/**
 * Récupère les producteurs d'une coopérative avec pagination
 * @param cooperativeId - ID de la coopérative
 * @param page - Numéro de page (défaut: 1)
 * @param limit - Nombre d'éléments par page (défaut: 20)
 * @returns Promise avec les producteurs et métadonnées de pagination
 */
export const getProducers = async (
  cooperativeId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Producer>> => {
  // Implementation...
};
```

### README des Composants

```typescript
/**
 * ProducerCard - Composant d'affichage d'un producteur
 * 
 * @example
 * ```tsx
 * <ProducerCard 
 *   producer={producer} 
 *   onPress={() => navigate('ProducerDetail', { id: producer.id })}
 * />
 * ```
 */
export const ProducerCard = ({ producer, onPress }: ProducerCardProps) => {
  // Implementation...
};
```

## 🔄 Workflow de Contribution

### 1. Préparation

```bash
# Synchroniser avec upstream
git fetch upstream
git checkout main
git merge upstream/main

# Créer une branche
git checkout -b feature/nouvelle-fonctionnalite
```

### 2. Développement

```bash
# Faire des commits réguliers
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"

# Pousser vers votre fork
git push origin feature/nouvelle-fonctionnalite
```

### 3. Pull Request

1. **Créer la PR** sur GitHub
2. **Remplir le template** de PR
3. **Attendre la review** de l'équipe
4. **Appliquer les corrections** demandées
5. **Merger** après approbation

### Template de Pull Request

```markdown
## Description
Brève description des changements apportés.

## Type de changement
- [ ] Correction de bug
- [ ] Nouvelle fonctionnalité
- [ ] Amélioration de la documentation
- [ ] Refactoring
- [ ] Autre

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration ajoutés/mis à jour
- [ ] Tests E2E ajoutés/mis à jour
- [ ] Tous les tests passent

## Documentation
- [ ] Documentation mise à jour
- [ ] Commentaires de code ajoutés
- [ ] README mis à jour si nécessaire

## Checklist
- [ ] Code conforme aux standards
- [ ] Pas de console.log oubliés
- [ ] Gestion d'erreurs appropriée
- [ ] Performance optimisée
```

## 🏷️ Convention de Commits

### Format

```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

### Types

- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage, point-virgules manquants, etc.
- `refactor` : Refactoring
- `test` : Tests
- `chore` : Tâches de maintenance

### Exemples

```bash
feat(auth): ajouter authentification OTP
fix(mobile): corriger bug de navigation
docs(api): mettre à jour documentation endpoints
test(producers): ajouter tests unitaires
```

## 🔍 Review Process

### Critères de Review

1. **Fonctionnalité**
   - Le code fait ce qu'il est censé faire
   - Gestion d'erreurs appropriée
   - Performance acceptable

2. **Qualité**
   - Code lisible et maintenable
   - Tests appropriés
   - Documentation à jour

3. **Sécurité**
   - Pas de vulnérabilités
   - Validation des entrées
   - Gestion des permissions

### Processus de Review

1. **Review automatique** : CI/CD checks
2. **Review manuelle** : Au moins 2 approbations
3. **Tests** : Tous les tests doivent passer
4. **Merge** : Après approbation

## 🚀 Déploiement

### Branches

- `main` : Version stable, déployée en production
- `develop` : Version de développement
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs

### Processus de Release

1. **Merge** vers `main`
2. **Tag** de version (`v1.2.3`)
3. **Déploiement automatique** via CI/CD
4. **Release notes** générées automatiquement

## 🆘 Support

### Obtenir de l'aide

- **Issues GitHub** : Pour les bugs et demandes de fonctionnalités
- **Discussions GitHub** : Pour les questions générales
- **Email** : pirlothiouk@gmail.com

### Ressources

- [Documentation du projet](../README.md)
- [Guide de développement](guide.md)
- [Standards de code](doc-standards.md)
- [Tests](testing.md)

## 🎉 Reconnaissance

Les contributeurs sont reconnus dans :
- **README** : Liste des contributeurs
- **Release notes** : Mentions des contributions
- **GitHub** : Graphique des contributeurs

Merci de contribuer à AgriConnect ! 🌾
