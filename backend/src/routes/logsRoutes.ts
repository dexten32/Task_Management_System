// backend/routes/LogsRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import { addLog } from "../controllers/logsController";
import { authenticateJWT } from "../middlewares/authMiddleware";
import asyncHandler from "../utils/asyncHandler";

const router = express.Router();

router.post(
  "/",
  authenticateJWT,
  asyncHandler(
    addLog as unknown as (
      // Type assertion for asyncHandler compatibility
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<any>
  )
);

export default router;
