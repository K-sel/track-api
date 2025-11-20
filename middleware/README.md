# Middleware

Validation des entrées et authentification JWT.

## Structure

### Validation d'authentification (`auth/`)

Middlewares de validation des champs pour register/login :

#### `validateEmail.mjs`
- Vérifie présence du champ email
- Valide format avec regex RFC 5322
- Retourne 422 si invalide

#### `validatePassword.mjs`
- Vérifie présence du mot de passe
- Vérifie longueur minimale (10 caractères)
- Retourne 422 si invalide

#### `validateUsername.mjs`
- Vérifie présence du username
- Vérifie longueur minimale (2 caractères)
- Retourne 422 si invalide

#### `validateFirstname.mjs`
- Vérifie présence du prénom
- Vérifie longueur minimale (2 caractères)
- Retourne 422 si invalide

#### `validateLastname.mjs`
- Vérifie présence du nom
- Vérifie longueur minimale (2 caractères)
- Retourne 422 si invalide

### Authentification JWT

#### `jwtAuthenticate.mjs`
- Extrait et vérifie le token JWT du header Authorization
- Décode le token et récupère l'ID utilisateur
- Attache l'utilisateur à `req.user`
- Retourne 401 si token invalide/manquant
- Utilisé pour protéger les routes d'activités et profil

## Architecture

**Pattern de validation :**
```javascript
export const validateField = (req, res, next) => {
  // 1. Extraire la valeur
  // 2. Vérifier présence
  // 3. Valider format/contraintes
  // 4. Appeler next() si OK, sinon res.status(422).json()
}
```

**Pattern d'authentification :**
```javascript
export const authenticate = async (req, res, next) => {
  // 1. Extraire token du header
  // 2. Vérifier et décoder le token
  // 3. Charger l'utilisateur depuis la DB
  // 4. Attacher à req.user et appeler next()
  // 5. Retourner 401 si échec
}
```

## Utilisation

Les middlewares sont chaînés dans les routes :
```javascript
router.post("/register",
  validateEmail,
  validatePassword,
  validateUsername,
  authController.createUser
)
```

Tous les middlewares utilisent le pattern Express `(req, res, next)` et appellent `next()` pour continuer le pipeline ou renvoient une réponse d'erreur pour court-circuiter.
