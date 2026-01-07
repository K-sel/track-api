import Activity from "../models/ActivitySchema.mjs";
import mongoose from "mongoose";
import { sendSuccess, sendError, ErrorCodes } from "../utils/responseFormatter.mjs";

/**
 * Contrôleur pour gérer les opérations CRUD sur les medias.
 * Fournit des méthodes pour récupérer, ajouter et supprimer des médias
 *
 * Note: Les images sont uploadées directement sur Cloudinary côté front.
 * Le backend reçoit juste les URLs Cloudinary et les associe aux activités.
 *
 * @module mediasController
 */
const mediasController = {

  /**
   * Récupère tous les médias de toutes les activités de l'utilisateur authentifié
   * GET /api/activities/medias/user
   */
  async getActivitiesMedias(req, res, next) {
    try {
      const userId = req.currentUserId;

      // Récupérer toutes les activités de l'utilisateur avec leurs médias
      const activities = await Activity.find({ userId })
        .select('_id medias date')
        .exec();

      // Construire la réponse avec tous les médias groupés par activité
      const activitiesWithMedias = activities
        .filter(activity => activity.medias && activity.medias.length > 0)
        .map(activity => ({
          activityId: activity._id,
          date: activity.date,
          medias: activity.medias
        }));

      return sendSuccess(res, 200, activitiesWithMedias, {
        totalActivitiesWithMedias: activitiesWithMedias.length,
        totalMedias: activitiesWithMedias.reduce((acc, act) => acc + act.medias.length, 0),
      });
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  /**
   * Récupère tous les médias d'une activité spécifique
   * GET /api/activities/:activityId/medias
   */
  async getActivityMedias(req, res, next) {
    try {
      const { activityId } = req.params;
      const authenticatedUserId = req.currentUserId;

      // Vérifier que l'activityId est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(activityId)) {
        return sendError(res, 400, "ID activité invalide", ErrorCodes.INVALID_ID);
      }

      // Récupérer l'activité
      const activity = await Activity.findById(activityId).exec();

      if (!activity) {
        return sendError(res, 404, "Activité non trouvée", ErrorCodes.ACTIVITY_NOT_FOUND);
      }

      // Vérifier que l'activité appartient à l'utilisateur authentifié
      if (activity.userId.toString() !== authenticatedUserId.toString()) {
        return sendError(res, 403, "Vous n'êtes pas autorisé à accéder aux médias de cette activité", ErrorCodes.FORBIDDEN);
      }

      return sendSuccess(res, 200, {
        activityId: activity._id,
        date: activity.date,
        totalMedias: activity.medias ? activity.medias.length : 0,
        medias: activity.medias || []
      });
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  /**
   * Ajoute une URL de média à une activité
   * POST /api/activities/:activityId/medias
   *
   * Body: { mediaUrl: "https://res.cloudinary.com/..." }
   */
  async addMediaToActivity(req, res, next) {
    try {
      const { activityId } = req.params;
      const { mediaUrl } = req.body;
      const authenticatedUserId = req.currentUserId;

      // Valider les inputs
      if (!activityId || !mongoose.Types.ObjectId.isValid(activityId)) {
        return sendError(res, 400, "ID activité invalide", ErrorCodes.INVALID_ID);
      }

      if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
        return sendError(res, 400, "mediaUrl est requis et doit être une URL valide", ErrorCodes.VALIDATION_ERROR);
      }

      // Récupérer l'activité
      const activity = await Activity.findById(activityId).exec();

      if (!activity) {
        return sendError(res, 404, "Activité non trouvée", ErrorCodes.ACTIVITY_NOT_FOUND);
      }

      // Vérifier que l'activité appartient à l'utilisateur
      if (activity.userId.toString() !== authenticatedUserId.toString()) {
        return sendError(res, 403, "Vous n'êtes pas autorisé à modifier cette activité", ErrorCodes.FORBIDDEN);
      }

      // Vérifier que le média n'existe pas déjà
      if (activity.medias && activity.medias.includes(mediaUrl)) {
        return sendError(res, 409, "Ce média est déjà associé à cette activité", ErrorCodes.CONFLICT);
      }

      // Vérifier que on ne dépasse pas le maximum de 10 médias
      if (activity.medias && activity.medias.length >= 10) {
        return sendError(res, 400, "Maximum de 10 médias atteint pour cette activité", ErrorCodes.LIMIT_EXCEEDED);
      }

      // Ajouter le média
      if (!activity.medias) {
        activity.medias = [];
      }
      activity.medias.push(mediaUrl);

      const updatedActivity = await activity.save();

      return sendSuccess(res, 201, {
        message: "Média ajouté avec succès",
        activityId: updatedActivity._id,
        totalMedias: updatedActivity.medias.length,
        medias: updatedActivity.medias
      });
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  /**
   * Supprime un média d'une activité
   * DELETE /api/activities/:activityId/medias
   *
   * Body: { mediaUrl: "https://res.cloudinary.com/..." }
   */
  async deleteMediaFromActivity(req, res, next) {
    try {
      const { activityId } = req.params;
      const { mediaUrl } = req.body;
      const authenticatedUserId = req.currentUserId;

      // Valider les inputs
      if (!activityId || !mongoose.Types.ObjectId.isValid(activityId)) {
        return sendError(res, 400, "ID activité invalide", ErrorCodes.INVALID_ID);
      }

      if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
        return sendError(res, 400, "mediaUrl est requis et doit être une URL valide", ErrorCodes.VALIDATION_ERROR);
      }

      // Récupérer l'activité
      const activity = await Activity.findById(activityId).exec();

      if (!activity) {
        return sendError(res, 404, "Activité non trouvée", ErrorCodes.ACTIVITY_NOT_FOUND);
      }

      // Vérifier que l'activité appartient à l'utilisateur
      if (activity.userId.toString() !== authenticatedUserId.toString()) {
        return sendError(res, 403, "Vous n'êtes pas autorisé à modifier cette activité", ErrorCodes.FORBIDDEN);
      }

      // Vérifier que le média existe
      if (!activity.medias || !activity.medias.includes(mediaUrl)) {
        return sendError(res, 404, "Ce média n'existe pas pour cette activité", ErrorCodes.MEDIA_NOT_FOUND);
      }

      // Supprimer le média
      activity.medias = activity.medias.filter(url => url !== mediaUrl);

      const updatedActivity = await activity.save();

      return sendSuccess(res, 200, {
        message: "Média supprimé avec succès",
        activityId: updatedActivity._id,
        totalMedias: updatedActivity.medias.length,
        medias: updatedActivity.medias
      });
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  }

};

export default mediasController;
