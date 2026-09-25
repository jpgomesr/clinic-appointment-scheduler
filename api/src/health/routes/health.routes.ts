import { Router } from "express";
import healthController from "../controller/health.controller";

const router = Router();

router.get("", healthController.check);

export default router;
