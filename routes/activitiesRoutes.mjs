import express from "express";
import activitiesController from "../controllers/activitiesController.mjs";

const router = express.Router();


// Route GET pour récupérer toutes les activités de l'utilisateur connecté
// A AJOUTE MIDDLEWARE AUTHENTIFICATION VERIFIER SI AUTHENTIFIE
router.get("/", activitiesController.getUserActivities);

// Route GET pour récupérer une activité spécifique par son ID
router.get("/:id", activitiesController.getActivityById);

export default router;
