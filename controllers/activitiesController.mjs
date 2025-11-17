import Activity from "../models/ActivitySchema.mjs";
import mongoose from "mongoose";

/**
 * Contrôleur pour gérer les opérations CRUD sur les activités.
 * Fournit des méthodes pour récupérer, ajouter et rechercher des activités dans la base de données.
 *
 * @module activitiesController
 */
const activitiesController = {

  //Récupère toutes les activités de l'utilisateur connecté
  async getUserActivities(req, res, next) {
    try {

      // A CORRIGER AVEC AUTHENTIFICATION IMPLEMENTEE
      // Récupérer l'ID de l'utilisateur
      // ObjectId de test fixe pour le développement
      const TEST_USER_ID = "673a1234567890abcdef1234";
      const userId = req.query.userId || TEST_USER_ID;

      if (!userId) {
        return res.status(401).json({
          error: "Utilisateur non authentifié ou userId manquant"
        });
      }

      // Récupère toutes les activités de l'utilisateur, triées par date décroissante
      const activities = await Activity.find({ userId })
        .sort({ date: -1 }) // Les plus récentes en premier
        .populate('gpsTraceId') // Traces GPS si il y en a
        .exec();

      res.status(200).json({
        success: true,
        count: activities.length,
        data: activities
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des activités:", error);
      next(error);
    }
  }
};

export default activitiesController;
