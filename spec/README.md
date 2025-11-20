# Tests

Tests d'intégration avec **Jest** et **Supertest**.

## Configuration

### Prérequis
MongoDB doit être en cours d'exécution localement pour les tests.

```bash
# Vérifier le statut de MongoDB
brew services list

# Démarrer MongoDB si nécessaire
brew services start mongodb-community@8.0
```

### Lancer les tests

```bash
npm test                              # Tous les tests
npm test -- register.spec.js         # Tests register uniquement
npm test -- login.spec.js            # Tests login uniquement
npm test -- spec/integration/auth/   # Tous les tests d'auth
```

## Structure

```
spec/
├── integration/
│   └── auth/
│       ├── register.spec.js    # Tests route POST /api/auth/register
│       └── login.spec.js       # Tests route POST /api/auth/login
└── set-up-automated-tests.md   # Guide setup pour dev
```

## Couverture actuelle

### Authentification (100%)
- **23 tests** au total
- **14 tests** pour `/api/auth/register`
- **9 tests** pour `/api/auth/login`

**Cas couverts :**
- ✅ Scénarios de succès (201, 200)
- ✅ Erreurs métier (409, 401)
- ✅ Validation complète des champs (422)
- ✅ Erreurs système MongoDB (500)

## Configuration Jest

Les tests utilisent une base de données de test séparée :
- Base de données : `mongodb://127.0.0.1/test`
- Configuré via `DATABASE_URL` dans `package.json`
- Cleanup automatique après chaque suite de tests

## Bonnes pratiques

- Chaque suite de tests gère sa propre connexion MongoDB
- Cleanup des données de test dans `afterAll()`
- Tests d'erreurs MongoDB reconnectent automatiquement
- Utilisation de `supertest` pour les requêtes HTTP
- Pas de mock des middlewares (tests d'intégration complets)
