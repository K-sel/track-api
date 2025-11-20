# Controllers

Logique métier et traitement des requêtes HTTP.

## Structure

### `authController.mjs`
Gestion de l'authentification.

**Méthodes :**
- `createUser(req, res)` - Inscription d'un nouvel utilisateur
  - Hash du password (bcrypt, cost factor 10)
  - Vérification unicité email
  - Retourne 201 + ID utilisateur créé
  - Erreurs : 409 (email existant), 500 (DB error)

- `login(req, res)` - Connexion utilisateur
  - Validation credentials (bcrypt.compare)
  - Génération JWT token
  - Retourne 200 + token
  - Erreurs : 401 (credentials invalides), 500 (DB error)

### `usersController.mjs`
CRUD et gestion des profils utilisateurs.

**Méthodes :**
- Gestion profil athlète (âge, poids, FCmax, VO2max)
- Configuration zones d'entraînement (Z1-Z5)
- Statistiques personnelles et historique

### `activitiesController.mjs`
CRUD et opérations sur les activités sportives.

**Méthodes principales :**
- Enregistrement activités avec tracé GPS
- Calcul métriques (distance, dénivelé, allure)
- Enrichissement météo automatique
- Agrégations et statistiques
- Gestion photos géolocalisées

## Architecture

Chaque controller :
- Reçoit `(req, res)` d'Express
- Utilise les modèles Mongoose pour accéder à la DB
- Gère les erreurs avec try/catch
- Retourne JSON avec codes HTTP appropriés
- Délègue la validation aux middlewares

## Dépendances

- `bcrypt` : Hash passwords (authController)
- `mongoose Models` : Accès base de données
- `jwtServices` : Génération/validation tokens (authController)
