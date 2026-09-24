import { Router } from "express";
import professionalsController from "./professionals.controller";

const router = Router();

router.get("", professionalsController.getAll);

export default router;