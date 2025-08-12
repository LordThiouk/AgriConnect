# 🔧 Guide de Résolution des Permissions GitHub

## ❌ Problème Rencontré

```
remote: Resolving deltas: 100% (5/5), completed with 4 local objects.
To https://github.com/LordThiouk/AgriConnect.git
 ! [remote rejected] main -> main (refusing to allow a Personal Access Token to create or update workflow `.github/workflows/ci-cd.yml` without `workflow` scope)
error: impossible de pousser des références vers 'https://github.com/LordThiouk/AgriConnect.git'
```

## 🔍 Cause du Problème

Le token GitHub actuel n'a pas les permissions `workflow` nécessaires pour créer ou modifier des fichiers GitHub Actions.

## ✅ Solutions

### Solution 1 : Mettre à jour le Token GitHub (Recommandée)

1. **Allez sur GitHub.com**
2. **Cliquez sur votre avatar** → Settings
3. **Dans le menu de gauche** → Developer settings → Personal access tokens → Tokens (classic)
4. **Trouvez votre token actuel** ou créez-en un nouveau
5. **Dans les scopes, cochez** :
   - ✅ `repo` (accès complet au repository)
   - ✅ `workflow` (gestion des workflows GitHub Actions)
   - ✅ `write:packages` (si vous utilisez Docker Hub)
6. **Générez le nouveau token**
7. **Copiez le token**

### Solution 2 : Mettre à jour le Token Local

```bash
# Configurez le nouveau token
git config --global credential.helper store
git push origin main
# Entrez votre nom d'utilisateur GitHub
# Entrez le nouveau token (pas votre mot de passe)
```

### Solution 3 : Utiliser GitHub CLI

```bash
# Installez GitHub CLI
sudo apt install gh

# Authentifiez-vous
gh auth login

# Poussez les changements
git push origin main
```

### Solution 4 : Upload Manuel via Interface Web

Si les solutions ci-dessus ne fonctionnent pas :

1. **Allez sur votre repository GitHub**
2. **Cliquez sur "Add file"** → "Upload files"
3. **Glissez-déposez les fichiers** :
   - `.github/workflows/ci-cd.yml`
   - `.github/environments/staging.yml`
   - `.github/environments/production.yml`
   - `Dockerfile`
   - `nginx.conf`
   - `docker-compose.yml`
   - `scripts/deploy.sh`
   - `CI_CD_README.md`
   - `SETUP_GUIDE.md`
   - `RESUME_CONFIGURATION.md`
   - `env.example`
   - `.dockerignore`
4. **Ajoutez un message de commit** : "Configuration CI/CD complète"
5. **Cliquez sur "Commit changes"**

## 🔐 Permissions Requises

### Pour GitHub Actions
- `repo` : Accès complet au repository
- `workflow` : Gestion des workflows
- `actions` : Gestion des actions

### Pour Docker Hub (optionnel)
- `write:packages` : Push d'images Docker

### Pour Déploiement
- `repo` : Accès au code source
- `workflow` : Exécution des workflows

## 📋 Checklist de Vérification

- [ ] Token GitHub avec permissions `workflow`
- [ ] Token configuré localement
- [ ] Test de push réussi
- [ ] Workflow visible dans l'onglet Actions
- [ ] Pipeline s'exécute automatiquement

## 🚨 Dépannage

### Token non reconnu
```bash
# Vérifiez la configuration
git config --list | grep credential

# Réinitialisez les credentials
git config --global --unset credential.helper
git config --global credential.helper store
```

### Permissions insuffisantes
- Vérifiez que le token a bien le scope `workflow`
- Vérifiez que vous êtes collaborateur du repository
- Vérifiez que le repository n'est pas en mode "Restricted"

### Erreur SSH
```bash
# Testez la connexion SSH
ssh -T git@github.com

# Si ça ne fonctionne pas, utilisez HTTPS
git remote set-url origin https://github.com/LordThiouk/AgriConnect.git
```

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs d'erreur GitHub
2. Consultez la documentation GitHub sur les tokens
3. Contactez l'équipe de développement

---

**Dernière mise à jour** : $(date)
**Statut** : ⚠️ **EN ATTENTE DE RÉSOLUTION** 