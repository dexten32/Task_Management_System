import { Router } from "express";
import { getPriorities } from "../controllers/priorityController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateJWT, getPriorities);

export default router;
