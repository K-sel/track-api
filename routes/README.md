# Routes

Définition des endpoints API et chaînage des middlewares.

## Structure

### `authRoutes.mjs`
Routes d'authentification non protégées.

**Endpoints :**
- `POST /api/auth/register` - Inscription
  - Middlewares : validateEmail, validatePassword, validateUsername, validateFirstname, validateLastname
  - Controller : authController.createUser

- `POST /api/auth/login` - Connexion
  - Middlewares : validateEmail, validatePassword
  - Controller : authController.login

### `usersRoutes.mjs`
Gestion des profils utilisateurs (protégé par JWT).

**Endpoints :**
- CRUD profil utilisateur
- Configuration zones cardio
- Statistiques personnelles

### `activitiesRoutes.mjs`
Gestion des activités sportives (protégé par JWT).

**Endpoints :**
- CRUD activités
- Upload photos géolocalisées
- Agrégations et statistiques
- Recherche géospatiale

## Architecture

Chaque fichier de routes :
1. Importe Express Router
2. Importe les controllers nécessaires
3. Importe les middlewares de validation/auth
4. Définit les routes avec leur chaîne de middlewares
5. Exporte le router

**Pattern :**
```javascript
router.method('/path', middleware1, middleware2, controller.method)
```

## Montage dans app.mjs

```javascript
app.use("/api/auth", authRoutes)         // Non protégé
app.use("/api/activities", activitiesRoutes)  // Protégé JWT
app.use("/users", usersRoutes)           // Protégé JWT
```

## Validation

La validation est déléguée aux middlewares avant d'atteindre le controller. Les routes ne contiennent que la logique de routage, pas de logique métier.
