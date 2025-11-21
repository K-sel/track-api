# Tests unitaires

Tests unitaires pour les composants isolés de l'application (middlewares, validateurs, utilitaires).

## Vue d'ensemble

Les tests unitaires permettent de tester des fonctions et modules individuels de manière isolée, sans dépendances externes comme MongoDB ou l'application Express complète.

**Différence avec les tests d'intégration :**
- **Tests unitaires** : Testent des fonctions isolées avec mocks/stubs
- **Tests d'intégration** : Testent les endpoints complets avec vraie DB

## Structure des fichiers

### [jwt.spec.js](jwt.spec.js)
Tests pour les fonctions de gestion JWT.

**À tester :**
- ✅ Génération de tokens JWT valides
- ✅ Validation de tokens JWT
- ✅ Vérification de la signature
- ✅ Gestion des tokens expirés
- ✅ Gestion des tokens invalides
- ✅ Extraction des claims (sub, exp)

**Exemple :**
```javascript
describe("JWT Utils", () => {
  it("devrait générer un token valide", () => {
    const userId = "507f1f77bcf86cd799439011";
    const token = generateToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });

  it("devrait valider un token correct", () => {
    const token = generateToken("507f1f77bcf86cd799439011");
    const decoded = verifyToken(token);

    expect(decoded.sub).toBe("507f1f77bcf86cd799439011");
  });

  it("devrait rejeter un token expiré", () => {
    const expiredToken = "eyJhbGc..."; // Token expiré

    expect(() => verifyToken(expiredToken)).toThrow();
  });
});
```

---

### [middleware.spec.js](middleware.spec.js)
Tests pour les middlewares Express.

**À tester :**

#### Middleware d'authentification
- ✅ Accepte les requêtes avec token valide
- ✅ Rejette les requêtes sans header Authorization (401)
- ✅ Rejette les requêtes avec token invalide (401)
- ✅ Rejette les requêtes avec token expiré (401)
- ✅ Attache l'utilisateur à `req.user`

#### Middleware d'autorisation
- ✅ Autorise l'accès aux ressources propres
- ✅ Interdit l'accès aux ressources d'autres utilisateurs (403)
- ✅ Gestion des IDs invalides

**Exemple :**
```javascript
import { authenticate } from "../../middlewares/auth.js";

describe("Middleware - authenticate", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it("devrait appeler next() avec un token valide", async () => {
    req.headers.authorization = "Bearer " + validToken;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  it("devrait retourner 401 sans token", async () => {
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
```

---

### [validators.spec.js](validators.spec.js)
Tests pour les schémas de validation Joi.

**À tester :**

#### Validation utilisateur
- ✅ Accepte les données valides
- ✅ Rejette username trop court/long
- ✅ Rejette password trop court
- ✅ Rejette age invalide (< 18 ou > 120)
- ✅ Accepte les champs optionnels

#### Validation activité
- ✅ Accepte les activités valides
- ✅ Rejette les types d'activité invalides
- ✅ Rejette les distances négatives
- ✅ Rejette stoppedAt avant startedAt
- ✅ Valide les coordonnées GPS
- ✅ Accepte les champs optionnels (notes, feeling)

**Exemple :**
```javascript
import { userSchema, activitySchema } from "../../validators/schemas.js";

describe("Validators - userSchema", () => {
  it("devrait valider un utilisateur correct", () => {
    const validUser = {
      username: "johndoe",
      password: "password123",
      age: 25
    };

    const { error } = userSchema.validate(validUser);
    expect(error).toBeUndefined();
  });

  it("devrait rejeter un username trop court", () => {
    const invalidUser = {
      username: "ab",
      password: "password123",
      age: 25
    };

    const { error } = userSchema.validate(invalidUser);
    expect(error).toBeDefined();
    expect(error.message).toContain("username");
  });
});

describe("Validators - activitySchema", () => {
  it("devrait valider une activité correcte", () => {
    const validActivity = {
      activityType: "run",
      distance: 5000,
      startedAt: "2024-01-01T10:00:00Z",
      stoppedAt: "2024-01-01T11:00:00Z"
    };

    const { error } = activitySchema.validate(validActivity);
    expect(error).toBeUndefined();
  });
});
```

---

## Exécution des tests

### Tous les tests unitaires
```bash
npm test -- spec/unit
```

### Tests spécifiques
```bash
npm test -- jwt.spec.js         # JWT uniquement
npm test -- middleware.spec.js  # Middlewares uniquement
npm test -- validators.spec.js  # Validateurs uniquement
```

### Mode watch
```bash
npm test -- --watch spec/unit
```

## Configuration

### Pas de base de données
Les tests unitaires n'ont **pas besoin** de MongoDB car ils testent des fonctions isolées.

### Mocking
Utilisez Jest pour mocker les dépendances :
```javascript
jest.mock("../../models/UserSchema.mjs");
```

## Bonnes pratiques

### Organisation
1. **Un fichier par module** - Grouper les tests par fichier source
2. **describe() par fonction** - Organiser avec des blocs describe
3. **Noms descriptifs** - Décrire le comportement attendu

### Isolation
1. **Pas de side effects** - Les tests ne doivent pas modifier l'état global
2. **Mocks propres** - Réinitialiser les mocks dans beforeEach
3. **Tests indépendants** - Chaque test doit pouvoir s'exécuter seul

### Coverage
1. **Cas nominaux** - Tester le comportement normal
2. **Cas d'erreur** - Tester les exceptions et erreurs
3. **Edge cases** - Tester les valeurs limites

## Template de test unitaire

```javascript
import { maFonction } from "../../utils/monModule.js";

describe("Mon Module", () => {
  describe("maFonction()", () => {
    it("devrait [comportement attendu] quand [condition]", () => {
      // Arrange
      const input = "test";
      const expected = "expected result";

      // Act
      const result = maFonction(input);

      // Assert
      expect(result).toBe(expected);
    });

    it("devrait lever une erreur si [condition invalide]", () => {
      expect(() => maFonction(null)).toThrow();
    });
  });
});
```

## Différence avec tests d'intégration

| Aspect | Tests unitaires | Tests d'intégration |
|--------|----------------|---------------------|
| **Scope** | Fonction isolée | Endpoint complet |
| **Base de données** | Mock/Stub | Vraie DB de test |
| **Vitesse** | Très rapide | Plus lent |
| **Dépendances** | Mockées | Réelles |
| **But** | Logique isolée | Comportement système |

## Ajouter de nouveaux tests

1. Identifier le module à tester
2. Créer un fichier `[module].spec.js` dans `spec/unit/`
3. Importer les fonctions à tester
4. Écrire les tests avec arrange-act-assert
5. Mocker les dépendances externes

## Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Jest Mocking](https://jestjs.io/docs/mock-functions)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
