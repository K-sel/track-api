# Helpers - Fonctions utilitaires pour les tests

Fonctions et utilitaires partagés par tous les tests.

## Vue d'ensemble

Les helpers centralisent la logique commune à plusieurs tests pour éviter la duplication de code et faciliter la maintenance.

## Structure des fichiers

### [database.js](database.js)
Gestion de la connexion MongoDB pour les tests.

**Fonctions principales :**

#### `connectDatabase()`
Établit une connexion à la base de données de test.

**Usage :**
```javascript
import { connectDatabase } from "../../helpers/database.js";

describe("Ma suite de tests", () => {
  beforeAll(async () => {
    await connectDatabase();
  });
});
```

**Notes :**
- Utilise la variable d'environnement `DATABASE_URL`
- Par défaut : `mongodb://127.0.0.1/test`
- Configuré dans `package.json` pour les tests

---

#### `closeDatabase()`
Ferme proprement la connexion MongoDB.

**Usage :**
```javascript
import { closeDatabase } from "../../helpers/database.js";

describe("Ma suite de tests", () => {
  afterAll(async () => {
    // Nettoyer les données
    await User.deleteMany({});

    // Fermer la connexion
    await closeDatabase();
  });
});
```

**Notes :**
- À appeler systématiquement dans `afterAll()`
- Évite les connexions pendantes
- Vérifie l'état de connexion avant de fermer

---

#### `isDatabaseConnected()`
Vérifie si la connexion est active.

**Usage :**
```javascript
import { isDatabaseConnected } from "../../helpers/database.js";

if (isDatabaseConnected()) {
  console.log("Base de données connectée ✅");
}
```

**Retourne :**
- `true` si connecté (readyState === 1)
- `false` sinon

**Utile pour :**
- Débogage
- Tests de connexion
- Vérification avant opérations DB

---

### [utils.js](utils.js)
Fonctions utilitaires diverses pour les tests.

**Fonctions principales :**

#### `generateValidJwt(user)`
Génère un token JWT valide pour les tests d'authentification.

**Paramètres :**
- `user` (Object) - L'utilisateur pour lequel générer le token
  - Doit avoir une propriété `_id`

**Retourne :**
- `Promise<string>` - Le token JWT signé

**Usage :**
```javascript
import { generateValidJwt } from "../../helpers/utils.js";
import { createMainTestUser } from "../../fixtures/userFixtures.js";

describe("Endpoint protégé", () => {
  it("devrait accepter un token valide", async () => {
    const user = await createMainTestUser();
    const token = await generateValidJwt(user);

    const res = await supertest(app)
      .get("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});
```

**Détails :**
- Token valide pour 7 jours
- Signé avec `process.env.SECRET_KEY`
- Claims : `{ sub: userId, exp: timestamp }`

---

#### `createTestActivity(user, overrides)`
Crée une activité de test simple dans la base de données.

**Paramètres :**
- `user` (Object) - L'utilisateur propriétaire de l'activité
- `overrides` (Object) - Propriétés optionnelles à remplacer

**Retourne :**
- `Promise<Activity>` - L'activité créée et sauvegardée

**Usage :**
```javascript
import { createTestActivity } from "../../helpers/utils.js";

describe("GET /api/activities", () => {
  it("devrait récupérer l'activité", async () => {
    const user = await createMainTestUser();

    // Activité par défaut (run de 10km)
    const activity = await createTestActivity(user);

    // Activité personnalisée
    const cycling = await createTestActivity(user, {
      activityType: "cycling",
      distance: 25000
    });
  });
});
```

**Valeurs par défaut :**
```javascript
{
  userId: user._id,
  date: new Date(),
  activityType: 'run',
  startedAt: il y a 1h,
  stoppedAt: maintenant,
  duration: 3600 (secondes),
  moving_duration: 3500,
  distance: 10000 (mètres),
  avgSpeed: 10 (km/h),
  elevationGain: 150 (mètres),
  elevationLoss: 150,
  startPosition: Lausanne (6.6323, 46.5197),
  endPosition: (6.6423, 46.5297)
}
```

---

## Utilisation dans les tests

### Template complet

```javascript
import supertest from "supertest";
import app from "../../app.js";
import User from "../../models/UserSchema.mjs";
import Activity from "../../models/ActivitySchema.mjs";
import { connectDatabase, closeDatabase } from "../helpers/database.js";
import { generateValidJwt, createTestActivity } from "../helpers/utils.js";
import { createMainTestUser } from "../fixtures/userFixtures.js";

describe("Ma suite de tests", () => {
  let testUser, authToken;

  beforeAll(async () => {
    // 1. Connexion à la DB
    await connectDatabase();

    // 2. Créer utilisateur de test
    testUser = await createMainTestUser();

    // 3. Générer token JWT
    authToken = await generateValidJwt(testUser);

    // 4. Créer données de test si nécessaire
    await createTestActivity(testUser);
  });

  afterAll(async () => {
    // 1. Nettoyer les données
    await Activity.deleteMany({ userId: testUser._id });
    await User.findByIdAndDelete(testUser._id);

    // 2. Fermer la connexion
    await closeDatabase();
  });

  it("devrait faire quelque chose", async () => {
    const res = await supertest(app)
      .get("/api/activities")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toBeDefined();
  });
});
```

---

## Différence avec les fixtures

| Aspect | Helpers | Fixtures |
|--------|---------|----------|
| **But** | Fonctions utilitaires | Données de test |
| **Contenu** | JWT, DB, logique | Objets, templates |
| **Quand utiliser** | Besoin fonction | Besoin données |
| **Exemple** | `generateValidJwt()` | `createMainTestUser()` |

**Règle simple :**
- **Fixtures** = Quoi (données)
- **Helpers** = Comment (fonctions)

---

## Bonnes pratiques

### Organisation
1. **Helpers = Fonctions pures** - Pas d'état global
2. **Une fonction = Une responsabilité**
3. **Noms explicites** - `generate`, `create`, `verify`, etc.

### Réutilisabilité
1. **Paramètres flexibles** - Accepter overrides
2. **Valeurs par défaut** - Pour simplifier l'usage
3. **Documentation** - JSDoc pour toutes les fonctions

### Maintenance
1. **Centralisation** - Une seule source de vérité
2. **Tests des helpers** - Tester les utilitaires eux-mêmes
3. **Éviter la duplication** - Si code répété → helper

---

## Ajouter un nouveau helper

### 1. Identifier le besoin
Vous avez du code dupliqué dans plusieurs tests ?
→ Créer un helper

### 2. Choisir le fichier
- Connexion DB → `database.js`
- Génération données → `utils.js`
- Nouveau domaine → Nouveau fichier

### 3. Écrire la fonction
```javascript
/**
 * Description de la fonction
 * @param {Type} param - Description du paramètre
 * @returns {Promise<Type>} Description du retour
 */
export async function monHelper(param) {
  // Implémentation
  return result;
}
```

### 4. Documenter
- JSDoc complet
- Exemple d'usage
- Notes importantes

### 5. Exporter
```javascript
export { monHelper };
```

### 6. Utiliser
```javascript
import { monHelper } from "../helpers/utils.js";
```

---

## Exemples d'usage courants

### Test avec authentification
```javascript
const user = await createMainTestUser();
const token = await generateValidJwt(user);

await supertest(app)
  .get("/api/activities")
  .set("Authorization", `Bearer ${token}`)
  .expect(200);
```

### Test de création d'activité
```javascript
const user = await createMainTestUser();
const activity = await createTestActivity(user, {
  activityType: "cycling",
  distance: 15000
});

expect(activity).toBeDefined();
expect(activity.activityType).toBe("cycling");
```

### Test de connexion DB
```javascript
await connectDatabase();
expect(isDatabaseConnected()).toBe(true);

// ... tests ...

await closeDatabase();
expect(isDatabaseConnected()).toBe(false);
```

---

## Dépendances

### Librairies
- **mongoose** - Gestion MongoDB
- **jsonwebtoken** - Génération JWT
- **util** - Promisify pour JWT

### Models
- `UserSchema.mjs`
- `ActivitySchema.mjs`

### Variables d'environnement
- `SECRET_KEY` - Signature JWT
- `DATABASE_URL` - URL de la DB de test

---

## Maintenance

### Mettre à jour un helper
1. Identifier tous les usages
2. Vérifier la rétrocompatibilité
3. Mettre à jour la documentation
4. Tester dans plusieurs contextes

### Supprimer un helper
1. Vérifier qu'il n'est plus utilisé
2. Grep dans tous les tests
3. Supprimer la fonction
4. Mettre à jour ce README
