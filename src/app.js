import express from "express";
import * as dotenv from "dotenv";
import matchRoutes from "./routes/match.routes.js";
import { errorHandler } from "./utils/errors.js";

dotenv.config();

const app = express();

app.use(express.json());

// Routes

app.get("/", (req, res) => {
  res.json({ message: "Sportz API is running" });
});

const prefix = process.env.PREFIXAPI || "api";
app.use(`/${prefix}/matches`, matchRoutes);


app.use(errorHandler);

export default app;
