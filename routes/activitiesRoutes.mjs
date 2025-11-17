import express from "express";
import activitiesController from "../controllers/activitiesController.mjs";

const router = express.Router();



/** Route GET pour récupérer toutes les activités de l'utilisateur connecté
*  Supporte la pagination, le tri et les filtres :
* - Pagination: ?page=1&limit=20 (défaut: page=1, limit=20)
* - Tri: ?sort=date | -date | distance | -distance | duration | -duration (défaut: -date)
* - Filtres: ?activityType=run&startDate=2024-01-01&endDate=2024-12-31&minDistance=5000&maxDistance=10000
*/
// A AJOUTER MIDDLEWARE AUTHENTIFICATION POUR VERIFIER SI UTILISATEUR EST AUTHENTIFIE
router.get("/", activitiesController.getUserActivities);

// Route GET pour récupérer une activité spécifique par son ID
router.get("/:id", activitiesController.getActivityById);

export default router;
