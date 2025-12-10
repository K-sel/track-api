import Activity from "../models/ActivitySchema.mjs";
import mongoose from "mongoose";
import { weatherEnrichementService } from "../services/weatherService.mjs";
import { statsService } from "../services/statsService.mjs";
import { bestPerformancesService } from "../services/bestPerformancesService.mjs";

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
      const userId = req.currentUserId;

      if (!userId) {
        return res.status(401).json({
          error: "Utilisateur non authentifié ou userId manquant",
        });
      }

      /**
       * Utilisation des filtres
       * GET /api/activities?page=1&limit=20
       */

      // Construction du filtre de base
      const filter = { userId };

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
      if (typeof req.query.minDistance != Number || typeof req.query.maxDistance != Number) return res.status(400).json({ message: "minDistance & maxDistance doit être un nombre" });

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

      const ALLOWED_SORTS = {
        date: { date: 1 },
        "-date": { date: -1 },
        distance: { distance: 1 },
        "-distance": { distance: -1 },
        duration: { duration: 1 },
        "-duration": { duration: -1 },
      };

      const sortField = ALLOWED_SORTS[req.query.sort] || { date: -1 };

      // Compte le total d'activités (pour la pagination)
      const total = await Activity.countDocuments(filter);

      // Récupère les activités avec filtres, tri et pagination
      const activities = await Activity.find(filter)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .exec();

      res.status(200).json({
        success: true,
        count: activities.length,
        total: total,
        page: page,
        totalPages: Math.ceil(total / limit),
        data: activities,
      });
    } catch (error) {
      res.status(500).json({message : error.message});
    }
  },

  // Récupère une activité spécifique par son ID
  async getActivityById(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier si l'ID est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "ID d'activité invalide",
        });
      }

      // Récupérer l'ID de l'utilisateur authentifié
      const userId = req.currentUserId;

      if (!userId) {
        return res.status(401).json({
          error: "Utilisateur non authentifié",
        });
      }

      // Récupère l'activité par son ID
      const activity = await Activity.findById(id).exec();

      // Si l'activité n'existe pas
      if (!activity) {
        return res.status(404).json({
          error: "Activité non trouvée",
        });
      }

      // Vérifier que l'activité appartient bien à l'utilisateur connecté
      if (activity.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à accéder à cette activité",
        });
      }

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      res.status(500).json({message : error.message});
    }
  },

  // Crée une nouvelle activité
  async createActivity(req, res, next) {
    try {
      const userId = req.currentUserId;

      if (!userId) {
        return res.status(401).json({
          error: "Utilisateur non authentifié ou userId manquant",
        });
      }

      // Validation des champs obligatoires
      const requiredFields = [
        "date",

        "startedAt",
        "stoppedAt",
        "duration",
        "moving_duration",

        "distance",
        "avgPace",
        "laps",

        "elevationGain",
        "elevationLoss",
        "altitude_min",
        "altitude_max",
        "altitude_avg",

        "startPosition",
        "endPosition",

        "encodedPolyline",
        "totalPoints",
        "samplingRate",

        "estimatedCalories",
      ];

      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: "Champs obligatoires manquants",
          missingFields: missingFields,
        });
      }

      // Validation des positions (format GeoJSON avec geometry)
      if (
        !req.body.startPosition.geometry ||
        !req.body.startPosition.geometry.coordinates ||
        req.body.startPosition.geometry.coordinates.length < 2
      ) {
        return res.status(400).json({
          error:
            "Format de startPosition invalide. Format attendu: { geometry: { type: 'Point', coordinates: [longitude, latitude] } }",
        });
      }
      if (
        !req.body.endPosition.geometry ||
        !req.body.endPosition.geometry.coordinates ||
        req.body.endPosition.geometry.coordinates.length < 2
      ) {
        return res.status(400).json({
          error:
            "Format de endPosition invalide. Format attendu: { geometry: { type: 'Point', coordinates: [longitude, latitude] } }",
        });
      }

      // Validation des médias si fournis (optionnel)
      if (req.body.medias) {
        if (!Array.isArray(req.body.medias)) {
          return res.status(400).json({
            error: "Le champ medias doit être un tableau",
          });
        }

        // Limiter à 10 médias maximum
        if (req.body.medias.length > 10) {
          return res.status(400).json({
            error: "Maximum 10 médias autorisés par activité",
          });
        }

        // Vérifier que chaque média est une URL (string non vide)
        const invalidMedia = req.body.medias.some(
          (media) => typeof media !== "string" || media.trim() === ""
        );
        if (invalidMedia) {
          return res.status(400).json({
            error: "Chaque média doit être une URL valide (string non vide)",
          });
        }
      }

      const weatherEnrichement = await weatherEnrichementService.agregate(
        req.body
      );

      const activityData = {
        ...req.body,
        weather: weatherEnrichement.weather,
        difficultyFactors: weatherEnrichement.difficultyFactors,
        difficultyScore: weatherEnrichement.difficultyScore,
        userId: userId,
      };

      const newActivity = new Activity(activityData);
      const savedActivity = await newActivity.save();

      // Mettre à jour les statistiques de l'utilisateur
      await statsService.update(savedActivity, userId);

      // Vérifier si des records ont été battus
      const recordsBroken = await bestPerformancesService.checkAndUpdate(
        savedActivity,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Activité crée avec succès",
        data: savedActivity,
        recordsBroken: recordsBroken.length > 0 ? recordsBroken : null,
      });
    } catch (error) {
      // Gestion des erreurs de validation Mongoose
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Erreur de validation",
          details: Object.values(error.errors).map((err) => err.message),
        });
      }
      // Gestion des erreurs de validation custom (pre-validate hooks)
      if (
        error.message &&
        error.message.includes("stoppedAt must be after startedAt")
      ) {
        return res.status(400).json({
          error: "Erreur de validation",
          details: [error.message],
        });
      }

      res.status(500).json({message : error.message});
    }
  },

  // Modifie une activité existante (champs modifiables uniquement)
  async updateActivity(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier si l'ID est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "ID d'activité invalide",
        });
      }

      const userId = req.currentUserId;

      // Récupérer l'activité existante pour vérifier qu'elle appartient à l'utilisateur
      const existingActivity = await Activity.findById(id);

      if (!existingActivity) {
        return res.status(404).json({
          error: "Activité non trouvée",
        });
      }

      // Vérifier que l'activité appartient bien à l'utilisateur
      if (
        existingActivity.userId &&
        existingActivity.userId.toString() !== userId.toString()
      ) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à modifier cette activité",
        });
      }

      // À Ajuster Liste des champs MODIFIABLES (whitelist pour la sécurité)
      const allowedFields = [
        "medias", // Médias (URLs Cloudinary)
        "elevationGain", // Dénivelé positif (si correction manuelle)
        "elevationLoss", // Dénivelé négatif (si correction manuelle)
        "estimatedCalories", // Calories estimées (si correction manuelle)
      ];

      // Filtrer uniquement les champs autorisés
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Vérifier qu'il y a au moins un champ à modifier
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: "Aucun champ modifiable fourni",
          allowedFields: allowedFields,
        });
      }

      // Validation du feeling si fourni
      if (updates.feeling) {
        const validFeelings = ["great", "good", "ok", "tired", "poor"];
        if (!validFeelings.includes(updates.feeling)) {
          return res.status(400).json({
            error: "Feeling invalide",
            validFeelings: validFeelings,
          });
        }
      }

      // Validation des médias si fournis
      if (updates.medias) {
        if (!Array.isArray(updates.medias)) {
          return res.status(400).json({
            error: "Le champ medias doit être un tableau",
          });
        }

        // Limiter à 10 médias maximum
        if (updates.medias.length > 10) {
          return res.status(400).json({
            error: "Maximum 10 médias autorisés par activité",
          });
        }

        // Vérifier que chaque média est une URL (string non vide)
        const invalidMedia = updates.medias.some(
          (media) => typeof media !== "string" || media.trim() === ""
        );
        if (invalidMedia) {
          return res.status(400).json({
            error: "Chaque média doit être une URL valide (string non vide)",
          });
        }
      }

      // Mettre à jour l'activité
      const updatedActivity = await Activity.findByIdAndUpdate(
        id,
        { $set: updates },
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        success: true,
        message: "Activité mise à jour avec succès",
        data: updatedActivity,
      });
    } catch (error) {
      // Gestion des erreurs de validation Mongoose
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Erreur de validation",
          details: Object.values(error.errors).map((err) => err.message),
        });
      }
      res.status(500).json({message : error.message});
    }
  },

  // Supprimer une activité
  async deleteActivity(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier si l'ID est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "ID d'activité invalide",
        });
      }

      const userId = req.currentUserId;

      // Récupérer l'activité existante pour vérifier qu'elle appartient à l'utilisateur
      const existingActivity = await Activity.findById(id);

      // Vérifier que l'activité existe
      if (!existingActivity) {
        return res.status(404).json({
          error: "Activité non trouvée",
        });
      }

      // Vérifier que l'activité appartient bien à l'utilisateur
      if (
        existingActivity.userId &&
        existingActivity.userId.toString() !== userId.toString()
      ) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à supprimer cette activité",
        });
      }

      // Supprimer l'activité
      await Activity.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Activité supprimée avec succès",
        deletedActivityId: id,
      });
    } catch (error) {
      res.status(500).json({message : error.message});
    }
  },
};

export default activitiesController;
