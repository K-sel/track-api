# Tests d'intégration - Authentification

Suite complète de tests pour les endpoints d'authentification de l'API.

## Vue d'ensemble

**23 tests** couvrant l'inscription et la connexion des utilisateurs.

## Structure des fichiers

### [register.spec.js](register.spec.js) - `POST /api/auth/register`
Tests pour l'inscription de nouveaux utilisateurs.

**Cas testés (14 tests) :**

#### Scénarios de succès
- ✅ Inscription réussie avec données valides (201)
- ✅ Vérification du hash du mot de passe
- ✅ Structure de réponse correcte (id, username, age, createdAt)

#### Erreurs métier
- ✅ Username déjà utilisé (409)
- ✅ Détection de duplication insensible à la casse

#### Validation des champs (422)
- ✅ Username manquant
- ✅ Username trop court (< 3 caractères)
- ✅ Username trop long (> 30 caractères)
- ✅ Password manquant
- ✅ Password trop court (< 6 caractères)
- ✅ Age manquante
- ✅ Age invalide (< 18 ans)
- ✅ Age invalide (> 120 ans)

#### Erreurs système
- ✅ Erreur de connexion MongoDB (500)

---

### [login.spec.js](login.spec.js) - `POST /api/auth/login`
Tests pour la connexion des utilisateurs existants.

**Cas testés (9 tests) :**

#### Scénarios de succès
- ✅ Connexion réussie avec credentials valides (200)
- ✅ Génération et retour d'un token JWT valide
- ✅ Connexion insensible à la casse du username

#### Erreurs métier
- ✅ Utilisateur inexistant (401)
- ✅ Mot de passe incorrect (401)

#### Validation des champs (422)
- ✅ Username manquant
- ✅ Password manquant

#### Erreurs système
- ✅ Erreur de connexion MongoDB (500)
- ✅ Reconnexion automatique après erreur

---

## Exécution des tests

### Tous les tests d'authentification
```bash
npm test -- spec/integration/auth
```

### Tests spécifiques
```bash
npm test -- register.spec.js    # Inscription uniquement
npm test -- login.spec.js       # Connexion uniquement
```

### Mode watch
```bash
npm test -- --watch spec/integration/auth
```

## Configuration

### Base de données de test
Les tests utilisent une base de données séparée :
```
mongodb://127.0.0.1/test
```

### Gestion de la connexion
Chaque fichier de test gère sa propre connexion MongoDB :
- `beforeAll()` : Connexion à la base de données via `connectDatabase()`
- `afterAll()` : Nettoyage des données et fermeture via `closeDatabase()`

### Cleanup automatique
Les données de test sont automatiquement supprimées après chaque suite :
```javascript
afterAll(async () => {
  await User.deleteMany({});
  await closeDatabase();
});
```

## Exemple de test

```javascript
import supertest from "supertest";
import app from "../../../app.js";
import User from "../../../models/UserSchema.mjs";
import { connectDatabase, closeDatabase } from "../../helpers/database.js";

describe("POST /api/auth/register", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await closeDatabase();
  });

  it("devrait créer un utilisateur avec des données valides", async () => {
    const res = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "newuser",
        password: "password123",
        age: 25
      })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.username).toBe("newuser");
    expect(res.body.age).toBe(25);
  });
});
```

## Dépendances

### Helpers
- [`database.js`](../../helpers/database.js) - Gestion de la connexion MongoDB

### Models
- `UserSchema.mjs` - Modèle utilisateur

### Librairies
- **Supertest** - Requêtes HTTP
- **Jest** - Framework de test
- **bcrypt** - Vérification du hash des mots de passe

## Points clés

### Sécurité
- Les mots de passe sont **toujours hashés** avec bcrypt
- Les tests vérifient que le hash est bien généré
- Les tokens JWT sont valides et vérifiables

### Validation
- Tous les champs requis sont testés
- Les limites min/max sont vérifiées
- Les formats invalides sont rejetés

### Isolation
- Chaque test est indépendant
- Les données sont nettoyées après chaque suite
- Pas d'interférence entre les tests

### Erreurs système
- Les erreurs MongoDB sont simulées et testées
- La reconnexion automatique est vérifiée
- Les codes HTTP appropriés sont retournés (500)

## Ajouter de nouveaux tests

Pour ajouter un nouveau cas de test d'authentification :

1. Identifier l'endpoint concerné (register ou login)
2. Ouvrir le fichier correspondant
3. Ajouter le test dans le bloc `describe` approprié
4. Utiliser la structure existante

### Template
```javascript
it("devrait [description du comportement attendu]", async function () {
  const res = await supertest(app)
    .post("/api/auth/[endpoint]")
    .send({
      // Données de test
    })
    .expect(/* code HTTP attendu */);

  // Assertions
  expect(res.body).toBeDefined();
});
```

## Maintenance

### Mettre à jour les statistiques
Après avoir ajouté ou supprimé des tests, mettez à jour :
1. Le nombre total de tests dans ce README
2. Le nombre de tests par fichier
3. Les statistiques dans le [README principal](../../README.md)
