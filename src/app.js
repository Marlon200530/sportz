import express from "express";
import * as dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import commentaryRoutes from "./routes/commentaryRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
const prefix = process.env.POSTFIXAPI || "api";
app.use(`/${prefix}`, userRoutes);
app.use(`/${prefix}`, matchRoutes);
app.use(`/${prefix}`, commentaryRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Sportz API is running" });
});

export default app;