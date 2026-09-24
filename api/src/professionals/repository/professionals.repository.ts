import { db } from "../../db/client";
import { professionals } from "../../db/schema";

const professionalsRepository = {
   findAll: async () => {
      return await db.select().from(professionals);
   },
};

export default professionalsRepository;
