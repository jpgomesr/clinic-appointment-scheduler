import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import { setupSocket } from "./socket";
import { logger } from "./shared/logger/logger";

const httpServer = createServer(app);
const io = setupSocket(httpServer);

app.locals.io = io;

const PORT = process.env.SERVER_PORT || 3000;
httpServer.listen(PORT, () =>
   logger.info(`API + WS listening on port ${PORT}`),
);
