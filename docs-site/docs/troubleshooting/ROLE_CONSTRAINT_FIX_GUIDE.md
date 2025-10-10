# Guide de Correction de la Contrainte de Rôle - AgriConnect

## 🎯 **Problème Identifié**

L'erreur "error saving new user" se produit car la table `profiles` a une contrainte `CHECK` qui ne permet que les rôles `('agent', 'superviseur', 'admin')`, mais nous essayons d'utiliser le rôle `'producer'` qui n'est pas autorisé.

---

## ✅ **Solution : Migration de Base de Données**

### **Étape 1: Accéder au Dashboard Supabase**

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet AgriConnect
4. Allez dans **SQL Editor** dans le menu de gauche

### **Étape 2: Exécuter la Migration**

1. Cliquez sur **"New query"**
2. Copiez et collez le contenu du fichier `scripts/apply-role-constraint-fix.sql`
3. Cliquez sur **"Run"** pour exécuter la migration

### **Étape 3: Vérifier la Migration**

Après l'exécution, vous devriez voir :
- ✅ Contrainte supprimée et recréée
- ✅ Fonction `handle_new_user` mise à jour
- ✅ Fonction `fix_existing_profiles` créée
- ✅ Résultats de la correction des profils existants

---

## 🔧 **Ce que fait la Migration**

### **1. Correction de la Contrainte**
```sql
-- Supprime l'ancienne contrainte
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Ajoute la nouvelle contrainte avec tous les rôles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'supervisor', 'agent', 'producer', 'coop_admin'));
```

### **2. Mise à Jour de la Fonction de Création**
```sql
-- Met à jour la fonction pour gérer tous les rôles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    COALESCE(new.raw_user_meta_data ->> 'role', 'agent') -- Default to 'agent'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **3. Correction des Profils Existants**
```sql
-- Crée une fonction pour corriger les profils avec des rôles invalides
CREATE OR REPLACE FUNCTION public.fix_existing_profiles()
-- ... (voir le fichier complet)
```

---

## 🧪 **Test de la Correction**

### **Après la Migration**

1. **Testez l'authentification mobile** :
   - Ouvrez l'application mobile
   - Essayez de vous connecter avec un numéro de téléphone
   - L'erreur "error saving new user" ne devrait plus apparaître

2. **Vérifiez la création de profil** :
   - Un nouveau profil devrait être créé automatiquement
   - Le rôle par défaut devrait être `'agent'`

3. **Testez avec différents rôles** :
   - Les rôles `'agent'` et `'producer'` devraient maintenant fonctionner
   - Les rôles `'admin'`, `'supervisor'`, `'coop_admin'` sont également supportés

---

## 📊 **Rôles Supportés**

| Rôle | Description | Plateforme |
|------|-------------|------------|
| `admin` | Administrateur système | Web |
| `supervisor` | Superviseur régional | Web |
| `agent` | Agent de terrain | Mobile |
| `producer` | Producteur agricole | Mobile |
| `coop_admin` | Administrateur de coopérative | Web |

---

## 🚨 **En Cas de Problème**

### **Si la Migration Échoue**

1. **Vérifiez les permissions** :
   - Assurez-vous d'être connecté avec un compte admin
   - Vérifiez que vous avez les droits sur la base de données

2. **Vérifiez la syntaxe** :
   - Copiez exactement le contenu du fichier `scripts/apply-role-constraint-fix.sql`
   - Vérifiez qu'il n'y a pas d'erreurs de copier-coller

3. **Exécutez par étapes** :
   - Exécutez d'abord la suppression de contrainte
   - Puis l'ajout de la nouvelle contrainte
   - Enfin la mise à jour de la fonction

### **Si l'Erreur Persiste**

1. **Vérifiez les logs** :
   - Allez dans **Logs** dans le dashboard Supabase
   - Cherchez les erreurs liées à la table `profiles`

2. **Vérifiez la structure** :
   - Allez dans **Table Editor**
   - Vérifiez que la contrainte a été mise à jour

---

## 🎉 **Résultat Attendu**

Après la migration :

- ✅ **Authentification mobile** fonctionne sans erreur
- ✅ **Création de profil** automatique pour les nouveaux utilisateurs
- ✅ **Tous les rôles** sont supportés
- ✅ **Compatibilité** avec l'application mobile et web

---

**Date de création** : 18 janvier 2025  
**Statut** : ✅ **PRÊT POUR APPLICATION**  
**Prochaine étape** : Exécuter la migration dans Supabase Dashboard
