import { db } from "../db/client";
import { professionals } from "../db/schema";

const professionalsService = {
   getAll: async () => {
      const professionalsReturn = await db.select().from(professionals);
      return professionalsReturn;
   },
};

export default professionalsService;
