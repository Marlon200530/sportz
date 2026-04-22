import * as http from "node:http";
import app from "./app.js";
import { attachWebSocketServer } from "./ws/server.js";

const PORT = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);
const HOST = process.env.HOST || "0.0.0.0";

if (Number.isNaN(PORT)) {
  console.error(`Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

const server = http.createServer(app);
const { broadcastMatchCreated } = attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;

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
