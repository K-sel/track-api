import Activity from "../models/ActivitySchema.mjs";
import mongoose from "mongoose";

/**
 * Contrôleur pour gérer les opérations CRUD sur les activités.
 * Fournit des méthodes pour récupérer, ajouter et rechercher des activités dans la base de données.
 *
 * @module activitiesController
 */
const activitiesController = {

/* Récupère toutes les activités de l'utilisateur connecté avec filtres et pagination
*     Supporte la pagination, le tri et les filtres :
*       - Pagination: ?page=1&limit=20 (défaut: page=1, limit=20)
*       - Tri: ?sort=date | -date | distance | -distance | duration | -duration (défaut: -date)
*       - Filtres: ?activityType=run&startDate=2024-01-01&endDate=2024-12-31&minDistance=5000&maxDistance=10000
*/
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

      /**
       * Utilisation des filtres
       * GET /api/activities?activityType=run&page=1&limit=20
       */

      // Construction du filtre de base
      const filter = { userId };

      // Filtre par type d'activité
      if (req.query.activityType) {
        filter.activityType = req.query.activityType;
      }

      // Filtre par plage de dates
      if (req.query.startDate || req.query.endDate) {
        filter.date = {};
        if (req.query.startDate) {
          filter.date.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          filter.date.$lte = new Date(req.query.endDate);
        }
      }

      // Filtre par distance
      if (req.query.minDistance || req.query.maxDistance) {
        filter.distance = {};
        if (req.query.minDistance) {
          filter.distance.$gte = Number(req.query.minDistance);
        }
        if (req.query.maxDistance) {
          filter.distance.$lte = Number(req.query.maxDistance);
        }
      }

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Tri (par défaut : date décroissante)
      const sortField = req.query.sort || '-date';

      // Compte le total d'activités (pour la pagination)
      const total = await Activity.countDocuments(filter);

      // Récupère les activités avec filtres, tri et pagination
      const activities = await Activity.find(filter)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .populate('gpsTraceId')
        .exec();

      res.status(200).json({
        success: true,
        count: activities.length,
        total: total,
        page: page,
        totalPages: Math.ceil(total / limit),
        data: activities
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des activités:", error);
      next(error);
    }
  },

  // Récupère une activité spécifique par son ID
  async getActivityById(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier si l'ID est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "ID d'activité invalide"
        });
      }

      // Récupère l'activité par son ID
      const activity = await Activity.findById(id)
        .populate('gpsTraceId') // Traces GPS si disponibles
        .exec();

      // Si l'activité n'existe pas
      if (!activity) {
        return res.status(404).json({
          error: "Activité non trouvée"
        });
      }

      res.status(200).json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'activité:", error);
      next(error);
    }
  }


};

export default activitiesController;
