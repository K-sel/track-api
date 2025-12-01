import express from "express";
import mediasController from "../controllers/mediasController.mjs"
import { jwtAuthenticate } from "../middleware/jwtAuthenticate.mjs";

const router = express.Router();

/**
 * GET /api/activities/medias/user/:userId
 * Récupère tous les médias de toutes les activités d'un utilisateur
 */
router.get("/medias/user/:userId", jwtAuthenticate, mediasController.getActivitiesMedias);

/**
 * GET /api/activities/:activityId/medias
 * Récupère tous les médias d'une activité spécifique
 */
router.get("/:activityId/medias", jwtAuthenticate, mediasController.getActivityMedias);

/**
 * POST /api/activities/:activityId/medias
 * Ajoute une URL de média à une activité
 * Body: { mediaUrl: "https://res.cloudinary.com/..." }
 */
router.post("/:activityId/medias", jwtAuthenticate, mediasController.addMediaToActivity);

/**
 * DELETE /api/activities/:activityId/medias
 * Supprime un média d'une activité par son URL
 * Body: { mediaUrl: "https://res.cloudinary.com/..." }
 */
router.delete("/:activityId/medias", jwtAuthenticate, mediasController.deleteMediaFromActivity);

export default router;
