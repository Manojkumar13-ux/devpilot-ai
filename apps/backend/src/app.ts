import express, { type Express } from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import { problemsRouter } from "./routes/problems.js";

const app: Express = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/auth", authRouter);
app.use("/problems", problemsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export { app };
