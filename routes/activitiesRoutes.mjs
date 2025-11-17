import express from "express";
import activitiesController from "../controllers/activitiesController.mjs";

const router = express.Router();


// Route GET pour récupérer toutes les activités de l'utilisateur connecté
// A AJOUTE MIDDLEWARE AUTHENTIFICATION VERIFIER SI AUTHENTIFIE
router.get("/", activitiesController.getUserActivities);

export default router;
