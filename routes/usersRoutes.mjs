import express from "express";
import { usersController } from "../controllers/usersController.mjs";
import { jwtAuthenticate } from "../middleware/jwtAuthenticate.mjs";

const router = express.Router();

router.get("/user", jwtAuthenticate, usersController.getUserInfos);
router.post("/user", jwtAuthenticate, usersController.updateUserInfos);

router.get("/yearly", jwtAuthenticate, usersController.getYearlyStats);
router.get("/monthly", jwtAuthenticate, usersController.getMonthlyStats);
router.get("/weekly", jwtAuthenticate, usersController.getWeeklyStats);



export default router;
