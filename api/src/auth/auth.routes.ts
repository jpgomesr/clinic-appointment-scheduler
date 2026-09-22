import { Router } from "express";
import authController from "./auth.controller";
import { authToken } from "./auth.middleware";

const router = Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/logout", authController.logout);
router.get("/me", authToken, authController.me);

export default router;
