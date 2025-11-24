# Tests unitaires

Tests unitaires pour les middlewares de l'application (authentification JWT et validation des formulaires).

## Vue d'ensemble

**24 tests** couvrant les middlewares de l'API.

Les tests unitaires permettent de tester des fonctions et modules individuels de manière isolée, sans dépendances externes comme l'application Express complète.

**Différence avec les tests d'intégration :**
- **Tests unitaires** : Testent des middlewares isolés avec mocks
- **Tests d'intégration** : Testent les endpoints complets avec vraie DB

## Structure des fichiers

### [jwt.spec.js](jwt.spec.js)
Tests pour le middleware d'authentification JWT (`jwtAuthenticate`).

**Cas testés (4 tests) :**
- ✅ Appel de `next()` avec un JWT valide
- ✅ Retour 401 si le token est manquant
- ✅ Retour 401 si le token n'est pas de type Bearer
- ✅ Retour 401 si le token est expiré

**Exemple :**
```javascript
describe("JWT Authenticate middleware test", () => {
  it("should call next() if JWT is valid", async () => {
    const user = await User.findOne({ email: "test@example.com" });
    const token = await generateValidJwt(user);
    req.get.mockReturnValue(`Bearer ${token}`);

    await jwtAuthenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 401 is token is missing", async () => {
    req.get.mockReturnValue("");

    await jwtAuthenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
```

---

### [validators.spec.js](validators.spec.js)
Tests pour les middlewares de validation des formulaires d'authentification.

**Cas testés (20 tests) :**

#### validateEmail (4 tests)
- ✅ Appel de `next()` pour un email valide
- ✅ Retour 422 si l'email est manquant
- ✅ Retour 422 pour un format d'email invalide
- ✅ Retour 422 pour un email sans domaine

#### validateFirstname (4 tests)
- ✅ Appel de `next()` pour un prénom valide
- ✅ Retour 422 si le prénom est manquant
- ✅ Retour 422 si le prénom est trop court (< 2 caractères)
- ✅ Appel de `next()` pour un prénom avec exactement 2 caractères

#### validateLastname (4 tests)
- ✅ Appel de `next()` pour un nom valide
- ✅ Retour 422 si le nom est manquant
- ✅ Retour 422 si le nom est trop court (< 2 caractères)
- ✅ Appel de `next()` pour un nom avec exactement 2 caractères

#### validatePassword (4 tests)
- ✅ Appel de `next()` pour un mot de passe valide
- ✅ Retour 422 si le mot de passe est manquant
- ✅ Retour 422 si le mot de passe est trop court (< 10 caractères)
- ✅ Appel de `next()` pour un mot de passe avec exactement 10 caractères

#### validateUsername (4 tests)
- ✅ Appel de `next()` pour un username valide
- ✅ Retour 422 si le username est manquant
- ✅ Retour 422 si le username est trop court (< 2 caractères)
- ✅ Appel de `next()` pour un username avec exactement 2 caractères

**Exemple :**
```javascript
describe("Middlewares validation for form submissions", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe("validateEmail", () => {
    it("should call next() for valid email", () => {
      req.body.email = "test@exemple.com";

      validateEmail(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 422 when email is missing", () => {
      req.body.email = undefined;

      validateEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        message: "L'email est requis"
      });
    });
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
npm test -- validators.spec.js  # Validateurs uniquement
```

### Mode watch
```bash
npm test -- --watch spec/unit
```

## Configuration

### Base de données
Note : Le fichier `jwt.spec.js` nécessite une connexion MongoDB pour créer un utilisateur de test et générer des tokens JWT valides.

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
