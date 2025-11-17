import express from "express";
import activitiesController from "../controllers/activitiesController.mjs";

const router = express.Router();

router.get("/", function (req, res, next) {
  res.send("Get from Activites routes");
});

router.get("/test", new activitiesController)

export default router;
