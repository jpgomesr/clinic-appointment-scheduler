import { sql } from "drizzle-orm";
import { db } from "../../db/client";

const healthRepository = {
   ping: async () => {
      await db.execute(sql`select 1`);
   },
};

export default healthRepository;
