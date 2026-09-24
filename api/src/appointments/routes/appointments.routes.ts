import { Router } from "express";
import appointmentsController from "../controller/appointments.controller";

const router = Router();

router.post("", appointmentsController.create);
router.delete("/:id", appointmentsController.delete);
router.put("/:id", appointmentsController.edit);
router.get("/:id", appointmentsController.get);
router.get("", appointmentsController.getAll);

export default router;
