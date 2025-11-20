# Models

Schémas Mongoose pour la structure de la base de données MongoDB.

## Structure

### `UsersSchema.mjs`
Modèle utilisateur avec profil athlète complet.

**Champs principaux :**
- **Auth** : username, email (unique), password (hashed)
- **Profil** : firstname, lastname, age
- **Stats athlète** : poids, taille, FCmax, VO2max
- **Zones cardio** : Z1-Z5 avec min/max BPM
- **Stats activités** : km totaux, temps total, nombre d'activités (agrégés)
- **Records personnels** : best pace, longest distance, max elevation

**Indexes :**
- `email` : unique index pour authentification
- `userId` : référence depuis Activities

### `ActivitySchema.mjs`
Activité sportive avec métriques détaillées.

**Champs principaux :**
- **Type** : run, trail, walk, cycling, hiking, other
- **Timing** : startedAt, stoppedAt, duration, moving_duration
- **Distance** : distance (m), avgSpeed (km/h), avgPace (min/km)
- **Dénivelé** : elevationGain, elevationLoss, altitude_max/min/avg
- **Position** : startPosition, endPosition (GeoJSON Point)
- **GPS** : gpsTraceId (référence vers ActivityTraceGPS)
- **Météo** : weather (température, conditions, vent)
- **Cardio** : avgHeartRate, maxHeartRate, zones distribution
- **Médias** : photos géolocalisées (Cloudinary URLs)
- **Difficulté** : difficultyScore (calculé automatiquement)

**Indexes géospatiaux :**
- `startPosition` : 2dsphere pour recherche proximité
- `endPosition` : 2dsphere

**Relations :**
- `userId` → User
- `gpsTraceId` → ActivityTraceGPS

### `ActivityTraceGPSSchema.mjs`
Tracé GPS complet de l'activité (LineString).

**Champs :**
- **activityId** : référence vers Activity
- **trace** : GeoJSON LineString avec tous les points GPS
- **points** : Array détaillé avec timestamp, altitude, speed, HR pour chaque point

**Index géospatial :**
- `trace` : 2dsphere pour requêtes spatiales sur le tracé

**Séparation du modèle :**
Trace GPS séparé d'Activity pour optimiser les performances (les traces peuvent être volumineuses).

### `MonthlyRecapSchema.mjs`
Résumé mensuel des activités par utilisateur.

**Champs :**
- **userId** : référence User
- **year, month** : période
- **totalKm** : distance totale du mois
- **totalTime** : temps total (secondes)
- **totalElevation** : dénivelé cumulé
- **activitiesCount** : nombre de sorties
- **byActivityType** : stats détaillées par type de sport

**Indexes :**
- Compound index : `(userId, year, month)` pour requêtes rapides

### `PersonalRecordsSchema.mjs`
Records personnels de l'utilisateur.

**Champs :**
- **userId** : référence User
- **longestDistance** : plus longue sortie
- **fastestPace** : meilleure allure
- **maxElevation** : plus grand dénivelé
- **longestDuration** : sortie la plus longue en temps
- Chaque record stocke : value, date, activityId

## Architecture

Tous les schémas :
- Utilisent Mongoose pour validation et typage
- Incluent timestamps automatiques (createdAt, updatedAt)
- Définissent des indexes pour performances
- Utilisent GeoJSON pour données spatiales (MongoDB 2dsphere)
- Supportent les références inter-collections via ObjectId

## Relations

```
User (1) ←→ (N) Activity
Activity (1) ←→ (0-1) ActivityTraceGPS
User (1) ←→ (N) MonthlyRecap
User (1) ←→ (1) PersonalRecords
```

## GeoJSON

Format utilisé pour géolocalisation :
```javascript
{
  type: "Point",
  coordinates: [longitude, latitude]
}
```

Permet requêtes MongoDB :
- `$near` : activités proches
- `$geoWithin` : dans une zone
- `$geoIntersects` : intersection de tracés
