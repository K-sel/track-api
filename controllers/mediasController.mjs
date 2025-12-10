import Activity from "../models/ActivitySchema.mjs";
import mongoose from "mongoose";

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
   * Récupère tous les médias de toutes les activités d'un utilisateur
   * GET /api/activities/:userId/medias
   */
  async getActivitiesMedias(req, res, next) {
    try {
      const { userId } = req.params;
      const authenticatedUserId = req.currentUserId;

      // Vérifier que l'utilisateur n'accède qu'à ses propres médias
      if (authenticatedUserId.toString() !== userId) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à accéder aux médias de cet utilisateur"
        });
      }

      // Vérifier que l'userId est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          error: "ID utilisateur invalide"
        });
      }

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

      res.status(200).json({
        success: true,
        totalActivitiesWithMedias: activitiesWithMedias.length,
        totalMedias: activitiesWithMedias.reduce((acc, act) => acc + act.medias.length, 0),
        data: activitiesWithMedias
      });
    } catch (error) {
      res.status(500).json({message : error.message});
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
        return res.status(400).json({
          error: "ID activité invalide"
        });
      }

      // Récupérer l'activité
      const activity = await Activity.findById(activityId).exec();

      if (!activity) {
        return res.status(404).json({
          error: "Activité non trouvée"
        });
      }

      // Vérifier que l'activité appartient à l'utilisateur authentifié
      if (activity.userId.toString() !== authenticatedUserId.toString()) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à accéder aux médias de cette activité"
        });
      }

      res.status(200).json({
        success: true,
        activityId: activity._id,
        date: activity.date,
        totalMedias: activity.medias ? activity.medias.length : 0,
        medias: activity.medias || []
      });
    } catch (error) {
      res.status(500).json({message : error.message});
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
        return res.status(400).json({
          error: "ID activité invalide"
        });
      }

      if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
        return res.status(400).json({
          error: "mediaUrl est requis et doit être une URL valide"
        });
      }

      // Récupérer l'activité
      const activity = await Activity.findById(activityId).exec();

      if (!activity) {
        return res.status(404).json({
          error: "Activité non trouvée"
        });
      }

      // Vérifier que l'activité appartient à l'utilisateur
      if (activity.userId.toString() !== authenticatedUserId.toString()) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à modifier cette activité"
        });
      }

      // Vérifier que le média n'existe pas déjà
      if (activity.medias && activity.medias.includes(mediaUrl)) {
        return res.status(409).json({
          error: "Ce média est déjà associé à cette activité"
        });
      }

      // Vérifier que on ne dépasse pas le maximum de 10 médias
      if (activity.medias && activity.medias.length >= 10) {
        return res.status(400).json({
          error: "Maximum de 10 médias atteint pour cette activité"
        });
      }

      // Ajouter le média
      if (!activity.medias) {
        activity.medias = [];
      }
      activity.medias.push(mediaUrl);

      const updatedActivity = await activity.save();

      res.status(201).json({
        success: true,
        message: "Média ajouté avec succès",
        activityId: updatedActivity._id,
        totalMedias: updatedActivity.medias.length,
        medias: updatedActivity.medias
      });
    } catch (error) {
      res.status(500).json({message : error.message});
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
        return res.status(400).json({
          error: "ID activité invalide"
        });
      }

      if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
        return res.status(400).json({
          error: "mediaUrl est requis et doit être une URL valide"
        });
      }

      // Récupérer l'activité
      const activity = await Activity.findById(activityId).exec();

      if (!activity) {
        return res.status(404).json({
          error: "Activité non trouvée"
        });
      }

      // Vérifier que l'activité appartient à l'utilisateur
      if (activity.userId.toString() !== authenticatedUserId.toString()) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à modifier cette activité"
        });
      }

      // Vérifier que le média existe
      if (!activity.medias || !activity.medias.includes(mediaUrl)) {
        return res.status(404).json({
          error: "Ce média n'existe pas pour cette activité"
        });
      }

      // Supprimer le média
      activity.medias = activity.medias.filter(url => url !== mediaUrl);

      const updatedActivity = await activity.save();

      res.status(200).json({
        success: true,
        message: "Média supprimé avec succès",
        activityId: updatedActivity._id,
        totalMedias: updatedActivity.medias.length,
        medias: updatedActivity.medias
      });
    } catch (error) {
      res.status(500).json({message : error.message});
    }
  }

};

export default mediasController;
