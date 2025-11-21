# Tests d'intégration - Activities

Cette suite de tests couvre tous les endpoints de l'API `/api/activities`.

## Structure des fichiers

Les tests sont organisés par endpoint pour faciliter la maintenance et la lisibilité :

### [get-activities.spec.js](get-activities.spec.js) - `GET /api/activities`
Tests pour la récupération de la liste des activités.

**Cas testés :**
- ✅ Récupération de toutes les activités de l'utilisateur
- ✅ Tri par date (par défaut)
- ✅ Filtres par type d'activité
- ✅ Filtres par plage de dates
- ✅ Filtres par plage de distance
- ✅ Tri par distance (croissant/décroissant)
- ✅ Pagination (limit et page)
- ✅ Tableau vide si aucun résultat
- ✅ Erreurs d'authentification (401)
- ✅ Combinaison de filtres

**Nombre de tests :** 13

---

### [get-activity-by-id.spec.js](get-activity-by-id.spec.js) - `GET /api/activities/:id`
Tests pour la récupération d'une activité spécifique.

**Cas testés :**
- ✅ Récupération de sa propre activité
- ✅ Interdiction d'accès aux activités d'autres utilisateurs (403)
- ✅ Erreur sans authentification (401)
- ✅ Erreur pour activité inexistante (404)
- ✅ Erreur pour ID invalide (400)

**Nombre de tests :** 5

---

### [create-activity.spec.js](create-activity.spec.js) - `POST /api/activities`
Tests pour la création d'activités.

**Cas testés :**
- ✅ Création d'activité réussie
- ✅ Création avec tous les types d'activité valides
- ✅ Création avec champs optionnels (notes, feeling, calories)
- ✅ Erreur sans authentification (401)
- ✅ Erreur avec champs manquants (400)
- ✅ Erreur avec type d'activité invalide (400)
- ✅ Erreur si stoppedAt avant startedAt (400)
- ✅ Erreur avec distance négative (400)

**Nombre de tests :** 8

---

### [update-activity.spec.js](update-activity.spec.js) - `PATCH /api/activities/:id`
Tests pour la modification d'activités.

**Cas testés :**
- ✅ Modification réussie de sa propre activité
- ✅ Modification des champs d'élévation
- ✅ Mises à jour partielles
- ✅ Interdiction de modifier l'activité d'un autre (403)
- ✅ Restriction aux champs modifiables uniquement
- ✅ Erreur sans authentification (401)
- ✅ Erreur pour activité inexistante (404)
- ✅ Erreur pour ID invalide (400)
- ✅ Erreur avec type d'activité invalide (400)
- ✅ Erreur avec distance négative (400)

**Nombre de tests :** 10

---

### [delete-activity.spec.js](delete-activity.spec.js) - `DELETE /api/activities/:id`
Tests pour la suppression d'activités.

**Cas testés :**
- ✅ Suppression réussie de sa propre activité
- ✅ Vérification de la suppression effective en DB
- ✅ Interdiction de supprimer l'activité d'un autre (403)
- ✅ Suppression de multiples activités indépendamment
- ✅ Erreur sans authentification (401)
- ✅ Erreur pour activité inexistante (404)
- ✅ Erreur pour ID invalide (400)
- ✅ Erreur lors d'une double suppression (404)

**Nombre de tests :** 7

---

## Statistiques

**Total des tests :** 43 tests

**Couverture complète :**
- ✅ GET /api/activities
- ✅ GET /api/activities/:id
- ✅ POST /api/activities
- ✅ PATCH /api/activities/:id
- ✅ DELETE /api/activities/:id

## Exécution des tests

### Tous les tests activities
```bash
npm test -- spec/integration/activities
```

### Un fichier spécifique
```bash
npm test -- spec/integration/activities/create-activity.spec.js
```

### Avec watch mode
```bash
npm test -- --watch spec/integration/activities
```

## Dépendances

Ces tests utilisent les fixtures définies dans `/spec/fixtures/` :
- `activityFixtures.js` - Données d'activités de test
- `userFixtures.js` - Données d'utilisateurs de test

Et les helpers dans `/spec/helpers/` :
- `utils.js` - Fonctions utilitaires (JWT, création activités simples)

## Bonnes pratiques

1. **Isolation des tests** - Chaque fichier gère ses propres données de test
2. **Cleanup** - Les données sont nettoyées dans `afterAll()`
3. **Fixtures réutilisables** - Utilisation des fixtures pour éviter la duplication
4. **Noms descriptifs** - Les descriptions de tests sont claires et en français
5. **Organisation logique** - Un fichier par endpoint/méthode HTTP

## Ajouter de nouveaux tests

Pour ajouter un nouveau cas de test :

1. Identifier l'endpoint concerné
2. Ouvrir le fichier correspondant
3. Ajouter le test dans le bloc `describe` approprié
4. Utiliser les fixtures et helpers existants
5. S'assurer du cleanup des données

### Exemple

```javascript
it("should test something new", async function () {
  const token = await generateValidJwt(testUser);

  const res = await supertest(app)
    .get("/api/activities/something")
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(res.body).toBeDefined();
});
```
