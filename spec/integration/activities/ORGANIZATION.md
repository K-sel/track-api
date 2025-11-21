# Organisation des tests Activities

## 🎯 Objectif

Les tests des endpoints `/api/activities` ont été réorganisés pour améliorer :
- **Lisibilité** - Chaque fichier est focalisé sur un seul endpoint
- **Maintenance** - Plus facile de trouver et modifier des tests spécifiques
- **Performance** - Tests peuvent être exécutés individuellement
- **Organisation** - Structure claire et logique

## 📁 Structure

```
spec/integration/activities/
├── get-activities.spec.js        (13 tests) - Liste des activités
├── get-activity-by-id.spec.js    (5 tests)  - Détail d'une activité
├── create-activity.spec.js       (8 tests)  - Création
├── update-activity.spec.js       (10 tests) - Modification
├── delete-activity.spec.js       (7 tests)  - Suppression
├── README.md                                 - Documentation des tests
└── ORGANIZATION.md                           - Ce fichier
```

**Total : 43 tests**

## 🔄 Architecture autonome

**Chaque fichier de test est complètement indépendant** :
- ✅ Gère sa propre connexion MongoDB
- ✅ Crée et nettoie ses propres données de test
- ✅ Ferme la connexion DB dans `afterAll()`

**Avantage** : Vous pouvez exécuter n'importe quel test individuellement sans dépendances !

## 📊 Couverture par endpoint

| Endpoint | Fichier | Tests | Description |
|----------|---------|-------|-------------|
| `GET /api/activities` | [get-activities.spec.js](get-activities.spec.js) | 13 | Liste, filtres, tri, pagination |
| `GET /api/activities/:id` | [get-activity-by-id.spec.js](get-activity-by-id.spec.js) | 5 | Récupération unitaire, sécurité |
| `POST /api/activities` | [create-activity.spec.js](create-activity.spec.js) | 8 | Création et validation |
| `PATCH /api/activities/:id` | [update-activity.spec.js](update-activity.spec.js) | 10 | Modification et restrictions |
| `DELETE /api/activities/:id` | [delete-activity.spec.js](delete-activity.spec.js) | 7 | Suppression et vérifications |

## 🚀 Exécution

### Tous les tests
```bash
npm test -- spec/integration/activities
```

### Tests d'un endpoint spécifique
```bash
# Tests de création uniquement
npm test -- spec/integration/activities/create-activity.spec.js

# Tests de modification uniquement
npm test -- spec/integration/activities/update-activity.spec.js

# etc.
```

### Watch mode pour développement
```bash
npm test -- --watch spec/integration/activities/create-activity.spec.js
```

## 🔧 Dépendances partagées

Tous les fichiers utilisent les mêmes fixtures et helpers :

### Fixtures ([/spec/fixtures/](../../fixtures/))
- `activityFixtures.js` - Données de test d'activités
- `userFixtures.js` - Données de test d'utilisateurs

### Helpers ([/spec/helpers/](../../helpers/))
- `utils.js` - Fonctions utilitaires (JWT, etc.)

## ✅ Avantages de cette organisation

1. **Fichiers plus courts** - ~100-200 lignes au lieu de 400+
2. **Tests ciblés** - Chaque fichier teste un seul endpoint
3. **Exécution rapide** - Possibilité de tester un seul fichier
4. **Isolation** - Chaque fichier gère ses propres données de test
5. **Parallélisation** - Jest peut exécuter les fichiers en parallèle
6. **Navigation facile** - Nom de fichier = endpoint testé

## 📝 Ajouter de nouveaux tests

### 1. Identifier le bon fichier
Trouvez le fichier correspondant à l'endpoint que vous voulez tester.

### 2. Ajouter le test
Ajoutez votre cas de test dans le bloc `describe` du fichier :

```javascript
it("should test a new scenario", async function () {
  const token = await generateValidJwt(testUser);

  const res = await supertest(app)
    .get("/api/activities")
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(res.body).toBeDefined();
});
```

### 3. Utiliser les fixtures
Réutilisez les fixtures existantes :

```javascript
import { createMultipleActivities } from "../../fixtures/activityFixtures.js";
import { createMainTestUser } from "../../fixtures/userFixtures.js";
```

### 4. Nettoyer les données
Assurez-vous que vos données sont nettoyées dans `afterAll()`.

## 🔄 Migration depuis l'ancien fichier

L'ancien fichier `activities.spec.js` a été conservé en backup sous le nom `activities.spec.js.backup`.

Pour supprimer le backup après vérification :
```bash
rm spec/integration/activities/activities.spec.js.backup
```

## 🎨 Conventions de nommage

- **Fichiers** : `{verb}-{resource}.spec.js` (ex: `create-activity.spec.js`)
- **Tests** : Descriptions en anglais commençant par "should"
- **Variables** : noms explicites en camelCase

## 📖 Documentation complémentaire

- [README.md](README.md) - Documentation détaillée des tests
- [/spec/fixtures/README.md](../../fixtures/README.md) - Guide des fixtures
