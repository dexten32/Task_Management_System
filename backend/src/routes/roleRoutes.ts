import { getAvailableRoles } from "../controllers/userController";
import express, { RequestHandler } from "express";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();
router.get("/roles", authenticateJWT, getAvailableRoles);

export default router;
