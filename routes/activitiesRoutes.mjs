import express from "express";
import activitiesController from "../controllers/activitiesController.mjs"
import { jwtAuthenticate } from "../middleware/jwtAuthenticate.mjs";

const router = express.Router();
/** Route GET pour récupérer toutes les activités de l'utilisateur connecté
*  Supporte la pagination, le tri et les filtres :
* - Pagination: ?page=1&limit=20 (défaut: page=1, limit=20)
* - Tri: ?sort=date | -date | distance | -distance | duration | -duration (défaut: -date)
* - Filtres: ?activityType=run&startDate=2024-01-01&endDate=2024-12-31&minDistance=5000&maxDistance=10000
*/
// A AJOUTER MIDDLEWARE AUTHENTIFICATION POUR VERIFIER SI UTILISATEUR EST AUTHENTIFIE
router.get("/", jwtAuthenticate, activitiesController.getUserActivities);

// Route GET pour récupérer une activité spécifique par son ID
router.get("/:id", jwtAuthenticate, activitiesController.getActivityById);

// Route POST pour créer une nouvelle activité
router.post("/", jwtAuthenticate, activitiesController.createActivity);

// Route PATCH pour modifier une activité existante
router.patch("/:id", jwtAuthenticate, activitiesController.updateActivity);

// Route DELETE pour supprimer une activité
router.delete("/:id", jwtAuthenticate, activitiesController.deleteActivity);

export default router;
