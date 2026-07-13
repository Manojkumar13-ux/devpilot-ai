import { Router, type Router as RouterType } from "express";
import { ProblemsController } from "../controllers/problems.controller.js";

const router: RouterType = Router();
const controller = new ProblemsController();

router.get("/", (req, res) => controller.list(req, res));
router.get("/:slug", (req, res) => controller.getBySlug(req, res));

export { router as problemsRouter };
