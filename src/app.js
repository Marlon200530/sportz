import express from "express";
import * as dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";
import matchRoutes from "./routes/match.routes.js";
import commentaryRoutes from "./routes/commentary.routes.js";
import { errorHandler } from "./utils/errors.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes

app.get("/", (req, res) => {
  res.json({ message: "Sportz API is running" });
});

const prefix = process.env.POSTFIXAPI || "api";
app.use(`/${prefix}/matches`, matchRoutes);
app.use(`/${prefix}`, commentaryRoutes);


app.use(errorHandler);

export default app;
