import { Request, Response } from "express";
import healthRepository from "../repository/health.repository";

const healthController = {
   check: async (_req: Request, res: Response) => {
      try {
         await healthRepository.ping();
         res.status(200).json({ status: "ok" });
      } catch {
         res.status(503).json({ status: "unavailable" });
      }
   },
};

export default healthController;
