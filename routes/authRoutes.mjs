import express from "express";
import AuthController from "../controllers/authController.mjs";
import { validateLoginRequestBody, validateMail } from "../middleware/userValidation.mjs";

const router = express.Router();
const authController = new AuthController()

router.post("/register", validateMail, authController.register )
router.post("/login", validateLoginRequestBody, authController.login )


export default router;
