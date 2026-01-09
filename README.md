# Track API 🏃

API REST pour le suivi d'activités sportives (course à pied) avec enrichissement automatique, statistiques détaillées et WebSocket temps réel.

## 📋 Vue d'ensemble

Track API est le backend d'une application de tracking GPS pour coureurs. Elle enregistre les activités avec données GPS complètes, enrichit automatiquement chaque sortie avec la météo et un score de difficulté, gère des photos géolocalisées, et fournit des statistiques granulaires ainsi que des records personnels.

## ✨ Fonctionnalités

### 🔐 Authentification & Comptes
- Inscription avec validation stricte (email RFC 5322, password ≥12 caractères)
- Authentification JWT (durée 7 jours)
- Modification email/password sécurisée
- Suppression de compte avec cascade (transactions MongoDB)
- Rate limiting (10 inscriptions/heure, 20 logins/5min par IP)

### 📍 Tracking GPS
- Enregistrement d'activités complètes avec :
  - Polyline encodée (@mapbox/polyline, compression ~50%)
  - Positions start/end (GeoJSON Point avec index 2dsphere)
  - Laps/segments avec métriques détaillées
  - Dénivelé positif/négatif, altitude min/max/moyenne
  - Durée totale et durée en mouvement (pauses exclues)
  - Allure moyenne et pace par lap
- Pagination, tri et filtres avancés (dates, distance)

### 🌦️ Enrichissement automatique
À chaque création d'activité, le serveur :
1. **Récupère la météo** (Open-Meteo) : température, humidité, vent, conditions
2. **Calcule un score de difficulté** (1.0-2.0) basé sur :
   - Dénivelé : `min(elevationGain / 500, 0.4)`
   - Vent : >40 km/h (+0.2), >20 km/h (+0.1)
   - Température : <0°C ou >32°C (+0.15), <5°C ou >28°C (+0.08)
   - Météo : Orage/Grêle (+0.1), Neige (+0.08), Pluie (+0.05)
3. **Met à jour les statistiques** (yearly, monthly, weekly)
4. **Vérifie les records personnels** (5K, 10K, Semi, Marathon)

### 📸 Médias
- Upload photos/vidéos sur Cloudinary (côté frontend)
- Backend stocke URLs et associe aux activités
- Max 10 médias par activité
- Routes dédiées pour CRUD complet

### 📊 Statistiques & Analytics
- **Agrégations multi-niveaux** : Ever, Year, Month, Week
- **Métriques trackées** : distance (km), temps (secondes), activités, dénivelé (m)
- **Records personnels** avec historique :
  - Distances : 5K, 10K, Semi-Marathon (21.0975 km), Marathon (42.195 km)
  - Calcul par interpolation linéaire dans les laps
  - Mise à jour automatique avec détection de records battus

### 🔴 WebSocket temps réel
- **Channel** : "users" (configurable via `VITE_WS_CHANNEL_NAME`)
- **Événements** :
  - `users_count` : Nombre de clients connectés
  - `community_totals` : Totaux agrégés (km, temps, activités, dénivelé, utilisateurs)
- **Broadcast** à chaque création d'activité
- **Capacité** : 500 clients max, 50KB max input, ping timeout 30s

## 🛠️ Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime | Node.js | ES modules (.mjs) |
| Framework | Express.js | 5.1.0 |
| Base de données | MongoDB + Mongoose | 8.19.1 |
| Authentification | JWT (jsonwebtoken) + bcrypt | 9.0.2 / 6.0.0 |
| WebSocket | wsmini | 1.2.0 |
| Compression GPS | @mapbox/polyline | 1.2.1 |
| Météo | Open-Meteo API | REST |
| Tests | Jest + Supertest | 30.2.0 / 7.1.4 |
| Documentation | Swagger UI + OpenAPI 3.1.0 | 5.0.1 |
| Déploiement | Render (API) + MongoDB Atlas + Cloudinary (médias) | Cloud |

## 🚀 Installation

### Prérequis
- Node.js ≥ 18
- MongoDB (local ou Atlas)
- Compte Cloudinary (pour médias)

### Configuration

1. Cloner le dépôt
```bash
git clone <repo-url>
cd track-api
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine :
```env
# Base de données
DATABASE_URL=mongodb://127.0.0.1:27017/track
# ou MongoDB Atlas : mongodb+srv://user:pass@cluster.mongodb.net/track

# Serveur
PORT=3030
NODE_ENV=development

# Sécurité
SECRET_KEY=<256-bit-hex-key>  # Générer avec : openssl rand -hex 32
BCRYPT_COST_FACTOR=13

# WebSocket
VITE_WS_CHANNEL_NAME=users

# Cloudinary (optionnel pour médias)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### Démarrage

**Développement** (avec auto-reload)
```bash
npm run dev
```

**Production**
```bash
npm start
```

L'API sera accessible sur `http://localhost:3030`

## 📖 Documentation API

### Swagger UI
Accéder à la documentation interactive :
```
http://localhost:3030/api-docs
```

### Endpoints principaux

#### Authentification (`/api/auth`)
- `POST /create-account` - Créer un compte
- `POST /login` - Se connecter (retourne JWT)
- `POST /update-account` - Modifier email/password
- `DELETE /delete-account` - Supprimer le compte

#### Activités (`/api/activities`)
- `GET /` - Lister activités (pagination, tri, filtres)
- `GET /:id` - Récupérer une activité
- `POST /` - Créer une activité (enrichissement auto)
- `PATCH /:id` - Modifier une activité (whitelist)
- `DELETE /:id` - Supprimer une activité (cascade stats)

#### Médias (`/api/medias`)
- `GET /all` - Tous les médias de l'utilisateur
- `GET /:activityId` - Médias d'une activité
- `POST /:activityId` - Ajouter un média
- `DELETE /:activityId` - Supprimer un média

#### Utilisateurs (`/api/users`)
- `GET /user` - Profil utilisateur
- `GET /yearly` - Statistiques annuelles
- `GET /monthly` - Statistiques mensuelles
- `GET /weekly` - Statistiques hebdomadaires
- `GET /best-performances` - Records personnels

### Authentification

Inclure le JWT dans le header pour les routes protégées :
```http
Authorization: Bearer <token>
```

### Exemples de requêtes

**Créer un compte**
```bash
curl -X POST http://localhost:3030/api/auth/create-account \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_runner",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "firstname": "John",
    "lastname": "Doe",
    "age": 28,
    "weight": 70
  }'
```

**Se connecter**
```bash
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Lister activités avec filtres**
```bash
curl -X GET "http://localhost:3030/api/activities?page=1&limit=20&sort=-date&startDate=2024-01-01T00:00:00.000Z&minDistance=5000" \
  -H "Authorization: Bearer <token>"
```

**Créer une activité**
```bash
curl -X POST http://localhost:3030/api/activities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-17T10:30:00.000Z",
    "startedAt": "2024-12-17T10:30:00.000Z",
    "stoppedAt": "2024-12-17T11:15:30.000Z",
    "duration": 2730,
    "moving_duration": 2650,
    "distance": 10000,
    "avgPace": "4:30",
    "laps": [...],
    "elevationGain": 150,
    "elevationLoss": 145,
    "altitude_min": 320,
    "altitude_max": 450,
    "altitude_avg": 385,
    "startPosition": {
      "geometry": {
        "type": "Point",
        "coordinates": [6.6327, 46.5197, 372]
      }
    },
    "endPosition": {
      "geometry": {
        "type": "Point",
        "coordinates": [6.6330, 46.5200, 370]
      }
    },
    "encodedPolyline": "u~w~Fs~{tE...",
    "totalPoints": 2730,
    "samplingRate": 1,
    "estimatedCalories": 750
  }'
```

## 🧪 Tests

### Couverture actuelle : 83%

Le projet utilise **Jest** et **Supertest** pour les tests d'intégration.

### Lancer les tests

```bash
npm test                    # Tous les tests
npm test:coverage           # Avec rapport de couverture
```

### Tests couverts

#### Auth (23 tests)
- ✅ Register : 14 tests (validation, unicité email, succès, erreurs)
- ✅ Login : 9 tests (credentials, tokens, erreurs)

#### Activities (tests complets)
- ✅ CRUD complet
- ✅ Pagination et filtres
- ✅ Enrichissement automatique
- ✅ Mise à jour statistiques
- ✅ Records personnels

#### Medias (tests complets)
- ✅ CRUD complet
- ✅ Limite 10 médias
- ✅ Validation URLs

#### Users (tests complets)
- ✅ Statistiques yearly/monthly/weekly
- ✅ Records personnels
- ✅ Profil utilisateur

## 🏗️ Architecture

### Structure des répertoires

```
track-api/
├── app.mjs                     # Point d'entrée Express
├── bin/
│   └── start.mjs               # Serveur HTTP + WebSocket
├── routes/                     # Définition des routes (4 fichiers)
│   ├── authRoutes.mjs
│   ├── activitiesRoutes.mjs
│   ├── mediasRoutes.mjs
│   └── usersRoutes.mjs
├── controllers/                # Contrôleurs (logique métier)
│   ├── authController.mjs
│   ├── activitiesController.mjs
│   ├── mediasController.mjs
│   └── usersController.mjs
├── models/                     # Schémas Mongoose
│   ├── UsersSchema.mjs
│   ├── ActivitySchema.mjs
│   ├── BestPerformancesSchema.mjs
│   ├── YearlyStatsSchema.mjs
│   ├── MonthlyStatsSchema.mjs
│   └── WeeklyStatsSchema.mjs
├── services/                   # Services métier
│   ├── jwtServices.mjs         # Création/vérification JWT
│   ├── statsService.mjs        # Agrégation statistiques
│   ├── bestPerformancesService.mjs  # Détection records
│   └── weatherService.mjs      # Enrichissement météo + difficulté
├── middleware/                 # Middlewares & validateurs
│   ├── jwtAuthenticate.mjs     # Authentification JWT
│   └── auth/                   # Validateurs (email, password, etc.)
├── websocket/                  # Gestion WebSocket
│   └── setup.mjs
├── utils/                      # Utilitaires
│   ├── calculatePace.mjs
│   ├── formatTime.mjs
│   ├── getWeekNumber.mjs
│   └── responseFormatter.mjs
├── spec/                       # Tests Jest
│   ├── auth/
│   ├── activities/
│   ├── medias/
│   └── users/
├── config/                     # Configuration
├── openapi.yml                 # Documentation OpenAPI 3.1.0
└── package.json
```

### Modèles de données

#### User
- Authentification (username, email, password hash)
- Profil (firstname, lastname, age, weight)
- Statistiques agrégées (Ever/Year/Month/Week : km, temps, activités, dénivelé)

#### Activity
- Timing (date, startedAt, stoppedAt, duration, moving_duration)
- Distance & Pace (distance, avgPace, laps[])
- Elevation (elevationGain/Loss, altitude_min/max/avg)
- GPS (startPosition, endPosition en GeoJSON, encodedPolyline)
- Enrichissement (weather, difficultyScore, difficultyFactors, estimatedCalories)
- Médias (medias[], max 10)

#### Stats (Yearly/Monthly/Weekly)
- userId, year, [month], [week]
- totalKm, totalActivities, totalTime, totalElevation

#### BestPerformances
- userId, distance (5000, 10000, 21097.5, 42195)
- bestPerformance (chrono, date, activityId)
- performanceHistory[]

### Index MongoDB

**Optimisations :**
- `Activity` : index composé `{ userId: 1, date: -1 }` pour requêtes rapides
- `Activity` : index géospatial `2dsphere` sur startPoint2dSphere et endPoint2dSphere
- `Stats` : index unique composé par userId + year/month/week
- `BestPerformances` : index unique composé `{ userId: 1, distance: 1 }`

### Transactions

Utilisées pour garantir la cohérence des données lors de :
- Suppression de compte (cascade User → Activities → Stats → BestPerformances)
- Suppression d'activité (Activity + décrémentation Stats)

## 🔒 Sécurité

- **Hash bcrypt** : Cost factor 13 pour passwords
- **JWT** : HS256, durée 7 jours, secret 256-bit
- **Rate limiting** : Protection anti-bruteforce sur auth endpoints
- **Validation stricte** : Email RFC 5322, password ≥12 caractères
- **Autorisation** : Utilisateurs ne peuvent accéder qu'à leurs propres données
- **Transactions** : Garantie de cohérence des données
- **CORS** : Whitelist origins en production

## 🌐 Déploiement

### Render (Backend)
1. Créer un Web Service
2. Build Command : `npm install`
3. Start Command : `npm start`
4. Variables d'environnement : Configurer dans Render Dashboard

### MongoDB Atlas
1. Créer un cluster gratuit
2. Whitelist IP (ou 0.0.0.0/0 pour Render)
3. Copier connection string dans `DATABASE_URL`

### Cloudinary (Médias)
1. Créer un compte gratuit
2. Récupérer credentials (cloud_name, api_key, api_secret)
3. Configurer dans variables d'environnement

## 📊 Performance

- **Polyline compression** : ~50% de réduction vs JSON brut
- **Index MongoDB** : Requêtes optimisées (userId + date)
- **Pagination** : Limit max 100 activités/page
- **WebSocket** : 500 clients simultanés, ping timeout 30s
- **Cache** : Aucun (données temps réel)

## 🔄 Format des réponses

### Succès
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Erreur
```json
{
  "success": false,
  "error": {
    "message": "Description de l'erreur",
    "code": "ERR_CODE",
    "details": []
  }
}
```

### Codes d'erreur
- `ERR_UNAUTHORIZED`, `ERR_INVALID_CREDENTIALS`, `ERR_INVALID_TOKEN`
- `ERR_FORBIDDEN`, `ERR_NOT_FOUND`
- `ERR_VALIDATION`, `ERR_INVALID_ID`, `ERR_MISSING_FIELDS`, `ERR_INVALID_FORMAT`
- `ERR_CONFLICT`, `ERR_EMAIL_EXISTS`, `ERR_DUPLICATE_RESOURCE`
- `ERR_LIMIT_EXCEEDED`, `ERR_RATE_LIMIT`
- `ERR_INTERNAL`, `ERR_DATABASE`

## 📝 Licence

MIT

## 👥 Contributeurs

Projet développé dans le cadre du cours ArchiOWeb à HEIG-VD.
