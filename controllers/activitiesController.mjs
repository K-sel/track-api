import Activity from "../models/ActivitySchema.mjs";
import mongoose from "mongoose";
import { weatherEnrichementService } from "../services/weatherService.mjs";
import { statsService } from "../services/statsService.mjs";
import { bestPerformancesService } from "../services/bestPerformancesService.mjs";
import {
  sendSuccess,
  sendError,
  ErrorCodes,
} from "../utils/responseFormatter.mjs";
import UsersSchema from "../models/UsersSchema.mjs";
import { wsServer } from "../websocket/socket.mjs";
import { broadcastCommunityTotals } from "../websocket/channel.mjs";

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
        return sendError(
          res,
          401,
          "Utilisateur non authentifié ou userId manquant",
          ErrorCodes.UNAUTHORIZED
        );
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

      const minDistance = parseFloat(req.query.minDistance);
      const maxDistance = parseFloat(req.query.maxDistance);

      if (req.query.minDistance && isNaN(minDistance)) {
        return sendError(
          res,
          400,
          "minDistance doit être un nombre",
          ErrorCodes.VALIDATION_ERROR
        );
      }

      if (req.query.maxDistance && isNaN(maxDistance)) {
        return sendError(
          res,
          400,
          "maxDistance doit être un nombre",
          ErrorCodes.VALIDATION_ERROR
        );
      }

      if (!isNaN(minDistance)) {
        filter.distance = filter.distance || {};
        filter.distance.$gte = minDistance;
      }
      if (!isNaN(maxDistance)) {
        filter.distance = filter.distance || {};
        filter.distance.$lte = maxDistance;
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

      return sendSuccess(res, 200, activities, {
        count: activities.length,
        total: total,
        page: page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  // Récupère une activité spécifique par son ID
  async getActivityById(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier si l'ID est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendError(
          res,
          400,
          "ID d'activité invalide",
          ErrorCodes.INVALID_ID
        );
      }

      // Récupérer l'ID de l'utilisateur authentifié
      const userId = req.currentUserId;

      if (!userId) {
        return sendError(
          res,
          401,
          "Utilisateur non authentifié",
          ErrorCodes.UNAUTHORIZED
        );
      }

      // Récupère l'activité par son ID
      const activity = await Activity.findById(id).exec();

      // Si l'activité n'existe pas
      if (!activity) {
        return sendError(
          res,
          404,
          "Activité non trouvée",
          ErrorCodes.ACTIVITY_NOT_FOUND
        );
      }

      // Vérifier que l'activité appartient bien à l'utilisateur connecté
      if (activity.userId.toString() !== userId.toString()) {
        return sendError(
          res,
          403,
          "Vous n'êtes pas autorisé à accéder à cette activité",
          ErrorCodes.FORBIDDEN
        );
      }

      return sendSuccess(res, 200, activity);
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  // Crée une nouvelle activité
  async createActivity(req, res, next) {
    try {
      const userId = req.currentUserId;

      const userExists = await UsersSchema.findById(userId);
      if (!userExists)
        return sendError(
          res,
          404,
          "Utilisateur introuvable",
          ErrorCodes.NOT_FOUND
        );

      if (!userId) {
        return sendError(
          res,
          401,
          "Utilisateur non authentifié ou userId manquant",
          ErrorCodes.UNAUTHORIZED
        );
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

      const missingFields = requiredFields.filter(
        (field) => req.body[field] === null || req.body[field] === undefined
      );

      if (missingFields.length > 0) {
        return sendError(
          res,
          400,
          "Champs obligatoires manquants",
          ErrorCodes.MISSING_FIELDS,
          missingFields
        );
      }

      // Validation des positions (format GeoJSON avec geometry)
      if (
        !req.body.startPosition.geometry ||
        !req.body.startPosition.geometry.coordinates ||
        req.body.startPosition.geometry.coordinates.length < 2
      ) {
        return sendError(
          res,
          400,
          "Format de startPosition invalide. Format attendu: { geometry: { type: 'Point', coordinates: [longitude, latitude] } }",
          ErrorCodes.INVALID_FORMAT
        );
      }
      if (
        !req.body.endPosition.geometry ||
        !req.body.endPosition.geometry.coordinates ||
        req.body.endPosition.geometry.coordinates.length < 2
      ) {
        return sendError(
          res,
          400,
          "Format de endPosition invalide. Format attendu: { geometry: { type: 'Point', coordinates: [longitude, latitude] } }",
          ErrorCodes.INVALID_FORMAT
        );
      }

      let weatherEnrichement;
      try {
        weatherEnrichement = await weatherEnrichementService.agregate(req.body);
      } catch (weatherError) {
        console.error('[createActivity] Weather service failed, using defaults:', weatherError.message);
        // Fallback avec des données par défaut si l'API météo échoue
        weatherEnrichement = {
          weather: {
            temperature: null,
            humidity: null,
            windSpeed: null,
            conditions: "unknown",
            fetched_at: new Date(),
          },
          difficultyScore: 1.0,
          difficultyFactors: {
            baseScore: 1.0,
            elevationBonus: Math.min(req.body.elevationGain / 500, 0.4),
            weatherBonus: 0,
            windBonus: 0,
            temperatureBonus: 0,
          },
        };
      }

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

      // Broadcaster les nouveaux totaux de la communauté via WebSocket
      try {
        await broadcastCommunityTotals(wsServer);
      } catch (wsError) {
        console.error('[createActivity] WebSocket broadcast failed:', wsError.message);
        // Ne pas bloquer la réponse si le broadcast échoue
      }

      const responseData = {
        message: "Activité crée avec succès",
        activity: savedActivity,
      };

      if (recordsBroken && recordsBroken.length > 0) {
        responseData.recordsBroken = recordsBroken;
      }

      return sendSuccess(res, 201, responseData);
    } catch (error) {
      // Gestion des erreurs de validation Mongoose
      if (error.name === "ValidationError") {
        return sendError(
          res,
          400,
          "Erreur de validation",
          ErrorCodes.VALIDATION_ERROR,
          Object.values(error.errors).map((err) => err.message)
        );
      }
      // Gestion des erreurs de validation custom (pre-validate hooks)
      if (
        error.message &&
        error.message.includes("stoppedAt must be after startedAt")
      ) {
        return sendError(
          res,
          400,
          "Erreur de validation",
          ErrorCodes.VALIDATION_ERROR,
          [error.message]
        );
      }

      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  // Modifie une activité existante (champs modifiables uniquement)
  async updateActivity(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier si l'ID est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendError(
          res,
          400,
          "ID d'activité invalide",
          ErrorCodes.INVALID_ID
        );
      }

      const userId = req.currentUserId;

      // Récupérer l'activité existante pour vérifier qu'elle appartient à l'utilisateur
      const existingActivity = await Activity.findById(id);

      if (!existingActivity) {
        return sendError(
          res,
          404,
          "Activité non trouvée",
          ErrorCodes.ACTIVITY_NOT_FOUND
        );
      }

      // Vérifier que l'activité appartient bien à l'utilisateur
      if (
        existingActivity.userId &&
        existingActivity.userId.toString() !== userId.toString()
      ) {
        return sendError(
          res,
          403,
          "Vous n'êtes pas autorisé à modifier cette activité",
          ErrorCodes.FORBIDDEN
        );
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
        return sendError(
          res,
          400,
          "Aucun champ modifiable fourni",
          ErrorCodes.VALIDATION_ERROR,
          allowedFields
        );
      }

      // Validation du feeling si fourni
      if (updates.feeling) {
        const validFeelings = ["great", "good", "ok", "tired", "poor"];
        if (!validFeelings.includes(updates.feeling)) {
          return sendError(
            res,
            400,
            "Feeling invalide",
            ErrorCodes.VALIDATION_ERROR,
            validFeelings
          );
        }
      }

      // Validation des médias si fournis
      if (updates.medias) {
        if (!Array.isArray(updates.medias)) {
          return sendError(
            res,
            400,
            "Le champ medias doit être un tableau",
            ErrorCodes.VALIDATION_ERROR
          );
        }

        // Limiter à 10 médias maximum
        if (updates.medias.length > 10) {
          return sendError(
            res,
            400,
            "Maximum 10 médias autorisés par activité",
            ErrorCodes.LIMIT_EXCEEDED
          );
        }

        // Vérifier que chaque média est une URL (string non vide)
        const invalidMedia = updates.medias.some(
          (media) => typeof media !== "string" || media.trim() === ""
        );
        if (invalidMedia) {
          return sendError(
            res,
            400,
            "Chaque média doit être une URL valide (string non vide)",
            ErrorCodes.VALIDATION_ERROR
          );
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

      return sendSuccess(res, 200, {
        message: "Activité mise à jour avec succès",
        activity: updatedActivity,
      });
    } catch (error) {
      // Gestion des erreurs de validation Mongoose
      if (error.name === "ValidationError") {
        return sendError(
          res,
          400,
          "Erreur de validation",
          ErrorCodes.VALIDATION_ERROR,
          Object.values(error.errors).map((err) => err.message)
        );
      }
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  // Supprimer une activité
  async deleteActivity(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.currentUserId;

      console.log('[deleteActivity] Requête DELETE reçue', {
        activityId: id,
        userId: userId,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });

      // Vérifier si l'ID est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('[deleteActivity] ID invalide', { id });
        return sendError(
          res,
          400,
          "ID d'activité invalide",
          ErrorCodes.INVALID_ID
        );
      }

      // Récupérer l'activité existante pour vérifier qu'elle appartient à l'utilisateur
      console.log('[deleteActivity] Recherche de l\'activité dans MongoDB...');
      const existingActivity = await Activity.findById(id);

      // Vérifier que l'activité existe
      if (!existingActivity) {
        console.log('[deleteActivity] Activité non trouvée', { activityId: id });
        return sendError(
          res,
          404,
          "Activité non trouvée",
          ErrorCodes.ACTIVITY_NOT_FOUND
        );
      }

      console.log('[deleteActivity] Activité trouvée', {
        activityId: id,
        ownerId: existingActivity.userId?.toString(),
        requestingUserId: userId.toString()
      });

      // Vérifier que l'activité appartient bien à l'utilisateur
      if (
        existingActivity.userId &&
        existingActivity.userId.toString() !== userId.toString()
      ) {
        console.log('[deleteActivity] Accès refusé - utilisateur non autorisé', {
          activityOwner: existingActivity.userId.toString(),
          requestingUser: userId.toString()
        });
        return sendError(
          res,
          403,
          "Vous n'êtes pas autorisé à supprimer cette activité",
          ErrorCodes.FORBIDDEN
        );
      }

      // Détecter si les transactions sont supportées
      const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DATABASE_URL?.includes('/test');
      const useTransactions = !isTestEnv && mongoose.connection.readyState === 1;

      console.log('[deleteActivity] Configuration de suppression', {
        isTestEnv,
        useTransactions,
        mongoReadyState: mongoose.connection.readyState,
        connectionName: mongoose.connection.name
      });

      let deletionResult;

      if (useTransactions) {
        // Tenter d'utiliser les transactions en production
        console.log('[deleteActivity] Tentative de suppression avec transaction...');
        let session;

        try {
          session = await mongoose.startSession();
          console.log('[deleteActivity] Session MongoDB créée');

          await session.startTransaction();
          console.log('[deleteActivity] Transaction démarrée');

          // Mettre à jour les statistiques avant la suppression
          console.log('[deleteActivity] Mise à jour des statistiques...');
          await statsService.remove(existingActivity, userId, session);
          console.log('[deleteActivity] Statistiques mises à jour');

          // Supprimer l'activité
          console.log('[deleteActivity] Suppression de l\'activité...');
          deletionResult = await Activity.findByIdAndDelete(id).session(session);
          console.log('[deleteActivity] Activité supprimée de MongoDB', {
            deletedId: deletionResult?._id?.toString(),
            success: !!deletionResult
          });

          await session.commitTransaction();
          console.log('[deleteActivity] Transaction validée avec succès');
        } catch (transactionError) {
          console.error('[deleteActivity] ERREUR lors de la transaction', {
            error: transactionError.message,
            code: transactionError.code,
            codeName: transactionError.codeName,
            stack: transactionError.stack
          });

          if (session) {
            await session.abortTransaction();
            console.log('[deleteActivity] Transaction annulée');
          }

          // Si l'erreur est liée aux transactions non supportées, retenter sans transaction
          if (
            transactionError.message?.includes('Transaction') ||
            transactionError.message?.includes('replica set') ||
            transactionError.code === 20 // Transaction numbers not supported
          ) {
            console.log('[deleteActivity] Les transactions ne sont pas supportées, nouvelle tentative sans transaction...');

            // Retenter sans transaction
            await statsService.remove(existingActivity, userId, null);
            deletionResult = await Activity.findByIdAndDelete(id);

            console.log('[deleteActivity] Suppression sans transaction réussie', {
              deletedId: deletionResult?._id?.toString(),
              success: !!deletionResult
            });
          } else {
            // Autre erreur, la relancer
            throw transactionError;
          }
        } finally {
          if (session) {
            await session.endSession();
            console.log('[deleteActivity] Session MongoDB fermée');
          }
        }
      } else {
        // En environnement de test ou si transactions non disponibles, exécuter sans transaction
        console.log('[deleteActivity] Suppression sans transaction...');
        await statsService.remove(existingActivity, userId, null);
        deletionResult = await Activity.findByIdAndDelete(id);
        console.log('[deleteActivity] Suppression directe réussie', {
          deletedId: deletionResult?._id?.toString(),
          success: !!deletionResult
        });
      }

      // Vérifier que la suppression a bien eu lieu
      if (!deletionResult) {
        console.error('[deleteActivity] ÉCHEC - Aucun document supprimé', { activityId: id });
        return sendError(
          res,
          500,
          "La suppression a échoué - aucun document n'a été supprimé",
          ErrorCodes.INTERNAL_ERROR
        );
      }

      console.log('[deleteActivity] ✅ Suppression réussie', {
        activityId: id,
        userId: userId,
        timestamp: new Date().toISOString()
      });

      return sendSuccess(res, 200, {
        message: "Activité supprimée avec succès",
        deletedActivityId: id,
      });
    } catch (error) {
      console.error('[deleteActivity] ❌ ERREUR FATALE', {
        error: error.message,
        stack: error.stack,
        activityId: req.params.id,
        userId: req.currentUserId
      });
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },
};

export default activitiesController;
