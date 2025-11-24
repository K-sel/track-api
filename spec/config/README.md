# Configuration Jest - Setup Global des Tests

Documentation du dossier `config/` et du fichier [setup.js](setup.js) qui configurent l'environnement de test global.

## Structure du dossier

```
spec/config/
├── setup.js          # Setup global Jest (exécuté avant tous les tests)
└── README.md         # Cette documentation
```

**Pourquoi un dossier config/ ?**
- ✅ Sépare clairement les fichiers de configuration des tests
- ✅ Permet d'ajouter facilement d'autres configs (teardown.js, etc.)
- ✅ Organisation plus professionnelle et scalable
- ✅ Suit les conventions modernes de structure de projet

## Vue d'ensemble

Le fichier `setup.js` est une fonction de **setup global Jest** qui s'exécute **une seule fois avant tous les tests** de la suite complète. Son rôle est de garantir que chaque exécution de tests démarre avec une base de données complètement vierge.

## Fonctionnement

### Quand s'exécute-t-il ?

```
npm run test
    ↓
Jest démarre
    ↓
✓ Base de données de test nettoyée ← setup.js s'exécute ICI (1 seule fois)
    ↓
Tests parallèles démarrent
    ↓
- spec/unit/validators.spec.js
- spec/unit/jwt.spec.js
- spec/integration/auth/login.spec.js
- spec/integration/auth/register.spec.js
- spec/integration/activities/*.spec.js
```

### Que fait-il exactement ?

1. **Vérifie la variable d'environnement** `DATABASE_URL`
   - Throw une erreur si non définie
   - Garantit qu'on ne nettoie pas la mauvaise base de données

2. **Se connecte à MongoDB**
   ```javascript
   await mongoose.connect(process.env.DATABASE_URL);
   ```

3. **Nettoie complètement la base de données**
   ```javascript
   await mongoose.connection.dropDatabase();
   ```
   - Supprime TOUTES les collections
   - Supprime TOUTES les données
   - Repart d'une base vierge

4. **Se déconnecte proprement**
   ```javascript
   await mongoose.disconnect();
   ```
   - Libère les ressources
   - Permet à chaque test de créer sa propre connexion

5. **Affiche un message de confirmation**
   ```
   ✓ Base de données de test nettoyée
   ```

## Configuration dans Jest

Le setup global est configuré dans [jest.config.js](../../jest.config.js) :

```javascript
export default {
  testEnvironment: "node",
  globalSetup: "./spec/config/setup.js", // ← Référence le fichier setup dans config/
  // ... autres configs
};
```

## Pourquoi ce fichier est nécessaire ?

### Problème résolu

**Avant setup.js :**
```
Exécution 1: Tests passent ✅
Exécution 2: E11000 duplicate key error ❌
Exécution 3: E11000 duplicate key error ❌
```

Les données des tests précédents restaient en base et causaient des conflits.

**Après setup.js :**
```
Exécution 1: Tests passent ✅
Exécution 2: Tests passent ✅
Exécution 3: Tests passent ✅
```

Chaque exécution repart d'une base vierge.

### Avantages

1. ✅ **Reproductibilité** - Les tests donnent les mêmes résultats à chaque fois
2. ✅ **Isolation** - Aucune pollution entre exécutions
3. ✅ **Simplicité** - Les tests individuels n'ont pas à nettoyer toute la DB
4. ✅ **Rapidité** - `dropDatabase()` est plus rapide que supprimer collection par collection
5. ✅ **Fiabilité** - Évite les erreurs de duplication (E11000)

## Architecture complète

```
┌─────────────────────────────────────────────────┐
│  npm run test                                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Jest démarre                                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  setup.js (1 fois)                              │
│  ├─ Se connecte à MongoDB                       │
│  ├─ dropDatabase()                              │
│  └─ Se déconnecte                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Tests s'exécutent en parallèle                 │
│                                                  │
│  ┌────────────────────────────────────┐         │
│  │ Fichier test 1                     │         │
│  │ beforeAll:                          │         │
│  │   ├─ Se connecte (automatique)     │         │
│  │   ├─ Nettoie ses données           │         │
│  │   └─ Crée ses données (email uniq) │         │
│  │ tests...                            │         │
│  │ afterAll:                           │         │
│  │   ├─ Nettoie ses données           │         │
│  │   └─ closeDatabaseConnection()     │         │
│  └────────────────────────────────────┘         │
│                                                  │
│  ┌────────────────────────────────────┐         │
│  │ Fichier test 2                     │         │
│  │ beforeAll: ...                      │         │
│  │ tests...                            │         │
│  │ afterAll: closeDatabaseConnection()│         │
│  └────────────────────────────────────┘         │
│                                                  │
│  ... (autres tests en parallèle)                │
└──────────────────────────────────────────────────┘
```

## Relation avec database.js

| Fichier | Rôle | Quand | Fréquence |
|---------|------|-------|-----------|
| [config/setup.js](setup.js) | Nettoie **toute** la DB | Avant tous les tests | 1 fois |
| [helpers/database.js](../helpers/database.js) | Ferme la connexion | Après chaque fichier de test | N fois |

**Ils sont complémentaires, pas redondants !**

## Variables d'environnement requises

```bash
DATABASE_URL=mongodb://127.0.0.1/test
```

**⚠️ Important :**
- Utilisez toujours une base de données de **test** dédiée
- Ne pointez JAMAIS vers la base de production
- Le setup fait un `dropDatabase()` qui supprime TOUT

## Bonnes pratiques

### ✅ À faire

1. **Toujours utiliser une DB de test**
   ```json
   "test": "DATABASE_URL=mongodb://127.0.0.1/test jest"
   ```

2. **Ne pas modifier setup.js sans raison**
   - C'est un fichier critique
   - Il affecte tous les tests

3. **Laisser setup.js gérer le nettoyage global**
   - Chaque test gère seulement ses propres données
   - Pas besoin de nettoyer toute la DB dans chaque test

### ❌ À éviter

1. **Ne pas connecter manuellement avant setup.js**
   - Laissez setup.js gérer la première connexion

2. **Ne pas supprimer le `globalSetup`**
   - Sans lui, les données persistent entre exécutions

3. **Ne pas utiliser `dropDatabase()` dans les tests individuels**
   - Ça casserait les tests parallèles
   - C'est le rôle de setup.js

## Dépannage

### Les tests échouent avec "DATABASE_URL not set"

**Solution :**
```bash
# Vérifier package.json
"test": "cross-env DATABASE_URL=mongodb://127.0.0.1/test jest"
```

### MongoDB n'est pas démarré

**Solution :**
```bash
# macOS avec Homebrew
brew services start mongodb-community@8.0

# Vérifier le statut
brew services list
```

### Les tests passent individuellement mais échouent en parallèle

**Cause :** Emails ou identifiants dupliqués entre tests

**Solution :** Utiliser des emails uniques par fichier de test
```javascript
// login.spec.js → login-test@example.com
// register.spec.js → test@example.com
// jwt.spec.js → jwt-test@example.com
```

## Modification du setup

Si vous devez modifier le setup, voici le template :

```javascript
import mongoose from "mongoose";

export default async function globalSetup() {
  // Vérifications
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Connexion
  await mongoose.connect(process.env.DATABASE_URL);

  // Nettoyage (ou autre logique)
  await mongoose.connection.dropDatabase();

  // Message de confirmation
  console.log("✓ Base de données de test nettoyée");

  // Déconnexion propre
  await mongoose.disconnect();
}
```

## Pour aller plus loin

- [Documentation Jest globalSetup](https://jestjs.io/docs/configuration#globalsetup-string)
- [Documentation Mongoose](https://mongoosejs.com/docs/api/connection.html)
- [README principal des tests](../README.md)
- [README des helpers](../helpers/README.md)
- [README des fixtures](../fixtures/README.md)
