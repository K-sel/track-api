# Tests - Track API

Suite complète de tests unitaires et d'intégration pour l'API Track.

## Vue d'ensemble

Ce projet utilise **Jest** et **Supertest** pour tester l'API de manière exhaustive.

**Statistiques :**
- **90 tests** au total
- **23 tests** d'intégration pour l'authentification
- **43 tests** d'intégration pour les activités
- **24 tests** unitaires (JWT et middlewares de validation)

## Structure du projet

```
spec/
├── config/                # Configuration Jest
│   ├── setup.js          # Setup global (nettoyage DB avant tests)
│   └── README.md         # Documentation de la configuration
├── fixtures/              # Données de test réutilisables
│   ├── activityFixtures.js
│   ├── userFixtures.js
│   └── README.md
├── helpers/               # Fonctions utilitaires pour les tests
│   ├── database.js        # Fermeture connexion MongoDB
│   ├── utils.js          # Génération JWT, création activités
│   └── README.md
├── integration/           # Tests d'intégration des endpoints
│   ├── activities/       # Tests API activities (43 tests)
│   │   └── README.md
│   └── auth/             # Tests API authentification (23 tests)
│       └── README.md
└── unit/                 # Tests unitaires (24 tests)
    ├── jwt.spec.js       # Tests middleware JWT (4 tests)
    ├── validators.spec.js # Tests middlewares validation (20 tests)
    └── README.md
```

## Configuration

### Prérequis

MongoDB doit être en cours d'exécution localement pour les tests.

```bash
# Vérifier le statut de MongoDB
brew services list

# Démarrer MongoDB si nécessaire
brew services start mongodb-community@8.0
```

### Variables d'environnement

Les tests utilisent une base de données séparée configurée dans `package.json` :
```json
"test": "DATABASE_URL=mongodb://127.0.0.1/test jest"
```

### Setup global

Le fichier [config/setup.js](config/setup.js) est exécuté **une seule fois avant tous les tests** et :
- Se connecte à la base de données de test
- Nettoie complètement la base de données (drop database)
- Se déconnecte proprement

Cela garantit que chaque exécution de tests démarre avec une base de données vierge.

📖 **[Documentation complète du setup](config/README.md)**

## Lancer les tests

### Tous les tests
```bash
npm test
```

### Par catégorie
```bash
npm test -- spec/integration/       # Tous les tests d'intégration
npm test -- spec/unit/              # Tous les tests unitaires
npm test -- spec/integration/auth/  # Tests authentification
npm test -- spec/integration/activities/  # Tests activities
```

### Fichiers spécifiques
```bash
npm test -- register.spec.js        # Tests register uniquement
npm test -- create-activity.spec.js # Tests création activité
```

### Mode watch (développement)
```bash
npm test -- --watch
```

## Couverture des tests

### Authentification (23 tests)
- ✅ POST `/api/auth/register` (14 tests)
- ✅ POST `/api/auth/login` (9 tests)

**Cas couverts :**
- Scénarios de succès (201, 200)
- Erreurs métier (409, 401)
- Validation complète des champs (422)
- Erreurs système MongoDB (500)

### Activities (43 tests)
- ✅ GET `/api/activities` (13 tests)
- ✅ GET `/api/activities/:id` (5 tests)
- ✅ POST `/api/activities` (8 tests)
- ✅ PATCH `/api/activities/:id` (10 tests)
- ✅ DELETE `/api/activities/:id` (7 tests)

**Cas couverts :**
- CRUD complet
- Filtres et pagination
- Validation des données
- Isolation des données utilisateur (403)
- Gestion des erreurs (400, 401, 404)

### Tests unitaires (24 tests)
- ✅ JWT Authenticate Middleware (4 tests)
  - Validation token valide
  - Rejet token manquant (401)
  - Rejet token non-Bearer (401)
  - Rejet token expiré (401)
- ✅ Middlewares de validation (20 tests)
  - validateEmail (4 tests)
  - validateFirstname (4 tests)
  - validateLastname (4 tests)
  - validatePassword (4 tests)
  - validateUsername (4 tests)

## Bonnes pratiques

### Architecture des tests
1. **Setup global** - La base de données est nettoyée automatiquement avant tous les tests via [config/setup.js](config/setup.js)
2. **Isolation** - Chaque suite de tests utilise des **emails uniques** pour éviter les conflits en exécution parallèle
3. **Cleanup automatique** - `afterAll()` nettoie les données créées et ferme la connexion
4. **Fixtures réutilisables** - Données de test centralisées dans `/fixtures`
5. **Helpers partagés** - Fonctions utilitaires dans `/helpers`

### Écriture des tests
1. **Tests d'intégration** - Pas de mocks des middlewares (tests complets)
2. **Emails uniques** - Chaque fichier de test doit utiliser des emails différents (ex: `login-test@example.com`, `register-test@example.com`)
3. **Nettoyage dans beforeAll** - Supprimer les données existantes avant de créer pour éviter les duplications
4. **JWT** - Génération via `generateValidJwt(user)`
5. **Noms descriptifs** - Descriptions en français et explicites
6. **Fermeture connexion** - Toujours appeler `closeDatabaseConnection()` dans `afterAll()`

### Exemple de test type
```javascript
import mongoose from "mongoose";
import supertest from "supertest";
import app from "../../app.mjs";
import User from "../../models/UsersSchema.mjs";
import Activity from "../../models/ActivitySchema.mjs";
import { closeDatabaseConnection } from "../helpers/database.js";
import { generateValidJwt } from "../helpers/utils.js";
import { createMainTestUser } from "../fixtures/userFixtures.js";

describe("GET /api/activities", () => {
  let testUser;

  beforeAll(async () => {
    await mongoose.connection;
    // Nettoyer avant de créer pour éviter les duplications
    await User.deleteOne({ email: "activities-test@example.com" });

    testUser = await createMainTestUser({
      email: "activities-test@example.com"
    });
  });

  afterAll(async () => {
    await Activity.deleteMany({ userId: testUser._id });
    await User.deleteOne({ email: "activities-test@example.com" });
    await closeDatabaseConnection();
  });

  it("devrait récupérer les activités", async () => {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

## Documentation détaillée

Pour plus d'informations sur chaque composant :

- **[Config README](config/README.md)** - Configuration Jest et setup global
- [Fixtures README](fixtures/README.md) - Données de test réutilisables
- [Helpers README](helpers/README.md) - Fonctions utilitaires
- [Auth Tests README](integration/auth/README.md) - Tests authentification
- [Activities Tests README](integration/activities/README.md) - Tests activities
- [Unit Tests README](unit/README.md) - Tests unitaires

## Ajouter de nouveaux tests

1. Identifier le type de test (unitaire/intégration)
2. Placer le fichier dans le bon dossier
3. Utiliser les fixtures et helpers existants
4. Suivre les conventions de nommage (`*.spec.js`)
5. Assurer le cleanup des données de test
