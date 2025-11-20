# Services

Logique métier réutilisable et services externes.

## Structure

### `jwtServices.mjs`
Gestion des tokens JWT pour l'authentification.

**Méthodes :**

#### `createToken(userId)`
Génère un JWT pour l'utilisateur.
- **Payload** : `{ sub: userId, exp, iat }`
- **Expiration** : 7 jours
- **Secret** : Récupéré depuis `process.env.SECRET_KEY`
- **Retour** : Token string signé
- **Erreur** : Throw si SECRET_KEY manquant ou erreur de signature

#### `verifyToken(token)`
Vérifie et décode un JWT.
- **Vérification** : Signature + expiration
- **Retour** : Payload décodé `{ sub, exp, iat }`
- **Erreur** : Throw si token invalide/expiré

#### `refreshToken()`
Non implémenté (placeholder pour future fonctionnalité de refresh token).

**Sécurité :**
- Utilise `jsonwebtoken` library
- Promisified pour async/await
- Secret obligatoire (check au démarrage dans app.mjs)
- Tokens signés avec HMAC SHA256 par défaut

## Architecture des services

Les services :
- Encapsulent la logique réutilisable
- Sont indépendants des controllers
- Gèrent les appels externes (APIs, librairies)
- Retournent des promesses (async/await)
- Throw des erreurs explicites

**Pattern d'utilisation :**
```javascript
// Dans le controller
import { jwtServices } from '../services/jwtServices.mjs'

try {
  const token = await jwtServices.createToken(userId)
  res.json({ token })
} catch (error) {
  res.status(500).json({ message: error.message })
}
```

## Services futurs possibles

Candidats pour extraction en services :
- **weatherServices** : Appels API météo pour enrichissement
- **difficultyServices** : Calcul du score de difficulté
- **geoServices** : Calculs géospatiaux (distance, dénivelé)
- **aggregationServices** : Calculs statistiques complexes
- **uploadServices** : Upload médias vers Cloudinary

## Configuration

Les services nécessitent des variables d'environnement :
- `SECRET_KEY` : Clé secrète pour signer les JWT (obligatoire)
- Futures : API keys météo, Cloudinary credentials, etc.

Vérifier que les env vars sont chargées dans `app.mjs` avec `dotenv/config`.
