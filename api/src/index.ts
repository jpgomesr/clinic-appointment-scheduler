import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import { setupSocket } from "./socket";

const httpServer = createServer(app);
const io = setupSocket(httpServer);

app.locals.io = io;

const PORT = process.env.SERVER_PORT || 3000;
httpServer.listen(PORT, () =>
   console.log(`API + WS listening on port ${PORT}`),
);
