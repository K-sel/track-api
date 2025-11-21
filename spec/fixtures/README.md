# Fixtures - Données de test

Ce dossier contient les fixtures (données de test) utilisées dans les tests d'intégration et unitaires.

## Organisation

### [activityFixtures.js](activityFixtures.js)
Fixtures pour les activités sportives.

**Fonctions principales :**
- `createMultipleActivities(userId, baseDate)` - Crée 3 activités variées (run, cycling, trail) avec différentes dates et distances
- `createSimpleWalkActivity(userId, baseDate)` - Crée une simple activité de marche

**Templates disponibles :**
- `activityTemplates.run(userId, overrides)` - Template pour une activité de course
- `activityTemplates.cycling(userId, overrides)` - Template pour une activité de cyclisme
- `activityTemplates.trail(userId, overrides)` - Template pour une activité de trail
- `activityTemplates.walk(userId, overrides)` - Template pour une activité de marche

### [userFixtures.js](userFixtures.js)
Fixtures pour les utilisateurs.

**Fonctions principales :**
- `createMainTestUser(overrides)` - Crée l'utilisateur principal pour les tests
- `createSecondaryTestUser(overrides)` - Crée un utilisateur secondaire (utile pour tester l'isolation des données)

**Templates disponibles :**
- `userTemplates.standard(overrides)` - Utilisateur standard (25 ans)
- `userTemplates.secondary(overrides)` - Utilisateur secondaire (30 ans)
- `userTemplates.young(overrides)` - Jeune utilisateur (18 ans)
- `userTemplates.senior(overrides)` - Utilisateur senior (65 ans)

## Utilisation

### Exemple dans un test

```javascript
import { createMainTestUser, createSecondaryTestUser } from "../../fixtures/userFixtures.js";
import { createMultipleActivities } from "../../fixtures/activityFixtures.js";

describe("My test suite", () => {
  let testUser;

  beforeAll(async () => {
    // Créer un utilisateur
    testUser = await createMainTestUser();

    // Créer des activités pour cet utilisateur
    await createMultipleActivities(testUser._id);
  });

  afterAll(async () => {
    // Nettoyage
    await Activity.deleteMany({ userId: testUser._id });
    await User.findByIdAndDelete(testUser._id);
  });

  it("should do something", async () => {
    // Votre test ici
  });
});
```

### Avec personnalisation

```javascript
// Créer un utilisateur avec des données personnalisées
const customUser = await createMainTestUser({
  username: "customuser",
  age: 35
});

// Utiliser un template sans sauvegarder
const userData = userTemplates.young({ username: "teenager" });
```

## Avantages

1. **Réutilisabilité** - Les fixtures peuvent être réutilisées dans plusieurs tests
2. **Lisibilité** - Les tests sont plus propres et focalisés sur la logique de test
3. **Maintenance** - Modifier une fixture met à jour tous les tests qui l'utilisent
4. **Cohérence** - Les données de test sont standardisées
5. **Flexibilité** - Les overrides permettent de personnaliser les données au besoin
