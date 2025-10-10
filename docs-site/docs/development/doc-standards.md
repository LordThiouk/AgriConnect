# 📝 Standards de Documentation

Standards et conventions pour la documentation AgriConnect.

## 🎯 Vue d'ensemble

Ce document définit les standards de documentation pour maintenir la cohérence et la qualité de la documentation AgriConnect.

## 📋 Principes Généraux

### 1. Clarté et Simplicité

- **Langage simple** : Éviter le jargon technique inutile
- **Phrases courtes** : Maximum 20 mots par phrase
- **Structure claire** : Hiérarchie logique des informations

### 2. Exhaustivité

- **Informations complètes** : Couvrir tous les aspects importants
- **Exemples pratiques** : Code et cas d'usage concrets
- **Liens pertinents** : Références vers d'autres documents

### 3. Maintenance

- **Mise à jour régulière** : Synchroniser avec le code
- **Versioning** : Suivre les versions du projet
- **Validation** : Vérifier l'exactitude des informations

## 📝 Format Markdown

### Structure des Documents

```markdown
# Titre Principal

Brève description du document.

## Section Principale

### Sous-section

Contenu de la sous-section.

#### Détail

Contenu détaillé.

## Autre Section

Contenu de l'autre section.
```

### Titres

- **H1** : Titre principal du document (un seul par document)
- **H2** : Sections principales
- **H3** : Sous-sections
- **H4** : Détails (utiliser avec parcimonie)

### Formatage du Texte

```markdown
**Texte en gras** pour les éléments importants
*Texte en italique* pour l'emphase
`Code inline` pour les éléments techniques
~~Texte barré~~ pour les éléments obsolètes
```

### Listes

```markdown
- Élément de liste simple
- Élément avec **gras**
- Élément avec `code`

1. Élément numéroté
2. Élément numéroté
3. Élément numéroté

- [ ] Tâche non terminée
- [x] Tâche terminée
```

### Code

```markdown
```typescript
// Code avec syntaxe highlighting
const example = "Hello World";
```

```bash
# Commande shell
npm install
```

```sql
-- Requête SQL
SELECT * FROM producers;
```
```

### Liens

```markdown
[Texte du lien](https://example.com)
[Lien interne](../autre-document.md)
[Lien avec titre](https://example.com "Titre du lien")
```

### Images

```markdown
![Alt text](path/to/image.png "Titre de l'image")
```

## 🏗️ Structure des Documents

### En-tête Standard

```markdown
# 📚 Titre du Document

Brève description du document et de son objectif.

## 🎯 Vue d'ensemble

Contexte et objectifs du document.

## 📋 Prérequis

- Prérequis 1
- Prérequis 2
- Prérequis 3

## 🔧 Configuration

Instructions de configuration.

## 📚 Ressources

- [Lien externe](https://example.com)
- [Documentation interne](../autre-doc.md)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
```

### Sections Standard

1. **Vue d'ensemble** : Contexte et objectifs
2. **Prérequis** : Ce qui est nécessaire
3. **Configuration** : Instructions de setup
4. **Utilisation** : Comment utiliser
5. **Exemples** : Cas d'usage concrets
6. **Résolution de problèmes** : Problèmes courants
7. **Ressources** : Liens utiles
8. **Support** : Comment obtenir de l'aide

## 💻 Documentation de Code

### Commentaires de Code

```typescript
/**
 * Récupère les producteurs d'une coopérative avec pagination
 * @param cooperativeId - ID de la coopérative
 * @param page - Numéro de page (défaut: 1)
 * @param limit - Nombre d'éléments par page (défaut: 20)
 * @returns Promise avec les producteurs et métadonnées de pagination
 * @throws {Error} Si la coopérative n'existe pas
 * @example
 * ```typescript
 * const producers = await getProducers('coop-123', 1, 10);
 * console.log(producers.data); // Liste des producteurs
 * ```
 */
export const getProducers = async (
  cooperativeId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Producer>> => {
  // Implementation...
};
```

### Documentation de Composants

```typescript
/**
 * ProducerCard - Composant d'affichage d'un producteur
 * 
 * Affiche les informations principales d'un producteur avec possibilité
 * d'interaction via un callback onPress.
 * 
 * @param producer - Données du producteur à afficher
 * @param onPress - Callback appelé lors du clic sur la carte
 * @param variant - Variante d'affichage (default, compact, detailed)
 * 
 * @example
 * ```tsx
 * <ProducerCard 
 *   producer={producer} 
 *   onPress={() => navigate('ProducerDetail', { id: producer.id })}
 *   variant="detailed"
 * />
 * ```
 */
export const ProducerCard = ({ 
  producer, 
  onPress, 
  variant = 'default' 
}: ProducerCardProps) => {
  // Implementation...
};
```

## 📊 Documentation d'API

### Endpoints

```markdown
## GET /api/producers

Récupère la liste des producteurs avec pagination.

### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| page | number | Non | Numéro de page (défaut: 1) |
| limit | number | Non | Nombre d'éléments par page (défaut: 20) |
| cooperative_id | string | Non | Filtrer par coopérative |

### Réponse

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Mamadou Diallo",
      "phone": "+221701234567",
      "cooperative_id": "coop-uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Paramètres invalides |
| 401 | Non authentifié |
| 403 | Permissions insuffisantes |
| 404 | Producteur non trouvé |
| 500 | Erreur serveur |
```

## 🧪 Documentation de Tests

### Tests Unitaires

```typescript
/**
 * Tests pour le composant ProducerCard
 * 
 * Vérifie que le composant affiche correctement les informations
 * du producteur et gère les interactions utilisateur.
 */
describe('ProducerCard', () => {
  const mockProducer = {
    id: '1',
    name: 'Mamadou Diallo',
    phone: '+221701234567',
    cooperative: 'Coopérative Test'
  };

  it('should display producer information', () => {
    render(<ProducerCard producer={mockProducer} />);
    
    expect(screen.getByText('Mamadou Diallo')).toBeOnTheScreen();
    expect(screen.getByText('+221701234567')).toBeOnTheScreen();
  });

  it('should call onPress when tapped', () => {
    const mockOnPress = jest.fn();
    render(<ProducerCard producer={mockProducer} onPress={mockOnPress} />);
    
    fireEvent.press(screen.getByText('Mamadou Diallo'));
    expect(mockOnPress).toHaveBeenCalledWith(mockProducer);
  });
});
```

## 📱 Documentation Mobile

### Composants React Native

```typescript
/**
 * ProducerCard - Composant mobile d'affichage d'un producteur
 * 
 * Composant optimisé pour l'affichage mobile avec support du
 * touch feedback et de l'accessibilité.
 * 
 * @platform ios,android
 * @accessibility
 * - Label: "Producteur {name}"
 * - Hint: "Appuyer pour voir les détails"
 * - Role: "button"
 * 
 * @example
 * ```tsx
 * <ProducerCard 
 *   producer={producer} 
 *   onPress={() => navigation.navigate('ProducerDetail', { id: producer.id })}
 * />
 * ```
 */
export const ProducerCard = ({ producer, onPress }: ProducerCardProps) => {
  // Implementation...
};
```

## 🌐 Documentation Web

### Composants React

```typescript
/**
 * ProducerCard - Composant web d'affichage d'un producteur
 * 
 * Composant responsive avec support des interactions clavier
 * et de l'accessibilité web.
 * 
 * @accessibility
 * - ARIA label: "Producteur {name}"
 * - Keyboard navigation: Tab, Enter, Space
 * - Screen reader: Annonce le nom et le téléphone
 * 
 * @responsive
 * - Mobile: Layout vertical, bouton plein largeur
 * - Tablet: Layout horizontal, bouton compact
 * - Desktop: Layout horizontal, bouton avec icône
 * 
 * @example
 * ```tsx
 * <ProducerCard 
 *   producer={producer} 
 *   onPress={() => router.push(`/producers/${producer.id}`)}
 * />
 * ```
 */
export const ProducerCard = ({ producer, onPress }: ProducerCardProps) => {
  // Implementation...
};
```

## 🔧 Documentation de Configuration

### Variables d'environnement

```markdown
## Variables d'environnement

### Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `SUPABASE_URL` | URL de votre projet Supabase | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `TWILIO_ACCOUNT_SID` | SID du compte Twilio | - |
| `TWILIO_AUTH_TOKEN` | Token d'authentification Twilio | - |
| `LOG_LEVEL` | Niveau de log | `info` |
```

## 📊 Documentation de Déploiement

### Étapes de déploiement

```markdown
## Déploiement en Production

### 1. Préparation

```bash
# Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Exécuter les tests
npm run test:ci
```

### 2. Build

```bash
# Build de production
npm run build:all

# Vérifier les artefacts
ls -la dist/
```

### 3. Déploiement

```bash
# Déployer sur Vercel
vercel --prod

# Vérifier le déploiement
curl https://agriconnect.vercel.app/health
```

### 4. Vérification

- [ ] Application accessible
- [ ] Authentification fonctionne
- [ ] Base de données connectée
- [ ] Notifications SMS actives
```

## 🔍 Validation de la Documentation

### Checklist de Qualité

- [ ] **Structure** : Hiérarchie logique des titres
- [ ] **Contenu** : Informations complètes et exactes
- [ ] **Exemples** : Code fonctionnel et commenté
- [ ] **Liens** : Tous les liens fonctionnent
- [ ] **Images** : Alt text et titres appropriés
- [ ] **Formatage** : Markdown valide et cohérent
- [ ] **Accessibilité** : Langage clair et simple
- [ ] **Maintenance** : Informations à jour

### Outils de Validation

```bash
# Vérifier le Markdown
npm run lint:docs

# Vérifier les liens
npm run check:links

# Générer la documentation
npm run docs:build
```

## 📚 Ressources

- [Markdown Guide](https://www.markdownguide.org/)
- [Docusaurus Documentation](https://docusaurus.io/docs)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [MDX Documentation](https://mdxjs.com/)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
