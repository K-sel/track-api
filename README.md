# Track API 🏃‍♂️

Une API REST pour le tracking d'activités sportives en temps réel, développée avec Node.js, Express et MongoDB.

## 📋 Description

Track API est le backend d'une application mobile de suivi d'activités sportives (course, vélo, trail). Elle permet d'enregistrer des sorties en temps réel via GPS, de capturer des photos géolocalisées, et d'analyser les performances avec enrichissement automatique des données météo et calcul de difficulté.

## ✨ Fonctionnalités principales

### 🔐 Gestion utilisateurs
- Inscription et authentification (JWT)
- Profil athlète personnalisé (âge, poids, FCmax, VO2max)
- Configuration des zones d'entraînement cardio (Z1-Z5)
- Statistiques personnelles et historique complet

### 📍 Tracking d'activités
Enregistrement en temps réel pendant la sortie :
- **Tracé GPS complet** (LineString avec points géolocalisés)
- **Métriques live** : distance, temps, allure, vitesse, dénivelé, altitude, fréquence cardiaque
- **Contrôles** : start, pause, resume, stop
- **Sauvegarde** automatique sur le serveur

### 📸 Photos géolocalisées
- Prise de photo pendant l'activité
- Géolocalisation automatique (lat/lng + km parcouru)
- Horodatage précis
- Stockage et lien avec l'activité

### 🌦️ Enrichissement automatique
Le serveur analyse chaque activité pour :
- Récupérer les conditions météo du moment
- Calculer un score de difficulté basé sur :
  - Dénivelé cumulé
  - Conditions météo (pluie, vent, température)
  - Terrain et altitude

### 📊 Analytics et agrégations
- Résumés mensuels (km, temps, dénivelé, nombre de sorties)
- Statistiques par type de sport
- Tendances et progression
- Meilleures performances
- Répartition des conditions météo
- Heatmap des activités

## 🛠️ Stack technique

- **Runtime** : Node.js
- **Framework** : Express.js
- **Base de données** : MongoDB (avec Mongoose ODM)
- **Authentification** : JWT
- **Géolocalisation** : GeoJSON (MongoDB geospatial queries)
- **Déploiement** : Render + MongoDB Atlas

## 🎯 Conformité cours ArchiOWeb

- ✅ User management (register + login)
- ✅ 2+ ressources liées (Activities ↔ Users, Zones ↔ Users)
- ✅ CRUD complet
- ✅ Listes paginées et filtrées
- ✅ Agrégations MongoDB
- ✅ Géolocalisation (GPS traces)
- ✅ Photos géolocalisées
- ✅ Authentification JWT
- ✅ Autorisations (owner only)
- ✅ Déploiement cloud
- ✅ Tests automatisés (10+)

## 👥 Équipe

Projet réalisé dans le cadre du cours ArchiOWeb à HEIG-VD.

## 📄 Licence

MIT
