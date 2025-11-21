# Tests - Track API

Suite complète de tests unitaires et d'intégration pour l'API Track.

## Vue d'ensemble

Ce projet utilise **Jest** et **Supertest** pour tester l'API de manière exhaustive.

**Statistiques :**
- **66 tests** au total
- **23 tests** d'intégration pour l'authentification
- **43 tests** d'intégration pour les activités
- Tests unitaires pour JWT, middlewares et validateurs

## Structure du projet

```
spec/
├── fixtures/              # Données de test réutilisables
│   ├── activityFixtures.js
│   ├── userFixtures.js
│   └── README.md
├── helpers/               # Fonctions utilitaires pour les tests
│   ├── database.js        # Gestion connexion MongoDB
│   ├── utils.js          # Génération JWT, création activités
│   └── README.md
├── integration/           # Tests d'intégration des endpoints
│   ├── activities/       # Tests API activities (43 tests)
│   │   └── README.md
│   └── auth/             # Tests API authentification (23 tests)
│       └── README.md
└── unit/                 # Tests unitaires
    ├── jwt.spec.js
    ├── middleware.spec.js
    ├── validators.spec.js
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

### Tests unitaires
- ✅ JWT (génération et validation)
- ✅ Middlewares (authentication, authorization)
- ✅ Validateurs (schémas de validation)

## Bonnes pratiques

### Architecture des tests
1. **Isolation** - Chaque suite de tests gère ses propres données
2. **Cleanup automatique** - `afterAll()` nettoie les données créées
3. **Fixtures réutilisables** - Données de test centralisées dans `/fixtures`
4. **Helpers partagés** - Fonctions utilitaires dans `/helpers`

### Écriture des tests
1. **Tests d'intégration** - Pas de mocks des middlewares (tests complets)
2. **Connexion DB** - Gestion via helpers (`connectDatabase`, `closeDatabase`)
3. **JWT** - Génération via `generateValidJwt(user)`
4. **Noms descriptifs** - Descriptions en français et explicites

### Exemple de test type
```javascript
import { connectDatabase, closeDatabase } from "../../helpers/database.js";
import { generateValidJwt } from "../../helpers/utils.js";
import { createMainTestUser } from "../../fixtures/userFixtures.js";

describe("GET /api/activities", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Activity.deleteMany({});
    await closeDatabase();
  });

  it("devrait récupérer les activités", async () => {
    const user = await createMainTestUser();
    const token = await generateValidJwt(user);

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
