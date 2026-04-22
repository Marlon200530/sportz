import * as http from "node:http";
import app from "./app.js";
import { attachWebSocketServer } from "./ws/server.js";

const rawPort = process.env.PORT;
const PORT = rawPort === undefined ? 3000 : Number(rawPort);
const HOST = process.env.HOST || "0.0.0.0";

if (
  rawPort !== undefined &&
  (rawPort.trim() === "" || !Number.isInteger(PORT) || PORT < 0 || PORT > 65535)
) {
  console.error(`Invalid PORT value: ${rawPort}. Expected an integer from 0 to 65535.`);
  process.exit(1);
}

const server = http.createServer(app);
const { broadcastMatchCreated, broadcastCommentaryCreated } = attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentaryCreated = broadcastCommentaryCreated;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }

  console.error("Server error:", error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : PORT;
  const baseUrl = HOST === "0.0.0.0" ? `http://localhost:${actualPort}` : `http://${HOST}:${actualPort}`;

  console.log(`Server running at ${baseUrl}`);
  console.log(`WebSocket server running at ${baseUrl.replace("http", "ws")}/ws`);
});
