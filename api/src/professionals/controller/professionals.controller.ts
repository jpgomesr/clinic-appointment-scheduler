import { Request, Response } from "express";
import professionalsService from "../service/professionals.service";

const professionalsController = {
   getAll: async (req: Request, res: Response) => {
      const professionals = await professionalsService.getAll();
      res.status(200).json({ professionals });
   },
};

export default professionalsController;
