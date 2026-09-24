import { Request, Response } from "express";
import professionalsService from "../service/professionals.service";

const professionalsController = {
   getAll: async (req: Request, res: Response) => {
      try {
         const professionals = await professionalsService.getAll();
         res.status(200).json({ professionals });
      } catch (error: any) {
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },
};

export default professionalsController;
