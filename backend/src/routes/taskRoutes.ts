import express from "express";
import {
  assignTask,
  getTasksController,
  getRecentTasks,
  getMyTasks,
  getDelayedTasks,
  updateTaskStatus,
  getPreviousTasks,
  getTaskLimit,
  getTaskById,
  getDashboardAggregates,
  getNextTaskId,
} from "../controllers/taskController";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { allowRoles } from "../middlewares/roleMiddleware";
import { Request, Response, NextFunction } from "express";
import { get } from "http";

const router = express.Router();

// Helper to wrap async route handlers
function asyncHandler(
  fn: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => Promise<any>,
): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// POST /api/tasks/assign
router.post("/assign", authenticateJWT, allowRoles("ADMIN", "MANAGER"), asyncHandler(assignTask));

// GET /api/tasks?assignedBy=xxx
router.get("/", authenticateJWT, asyncHandler(getTasksController));

// Additional routes
router.get(`/recent`, authenticateJWT, asyncHandler(getRecentTasks));

// GET /api/tasks/recentlimit
router.get("/recentlimit", authenticateJWT, asyncHandler(getTaskLimit));

router.get("/next-id", authenticateJWT, asyncHandler(getNextTaskId as any));


router.get("/my-tasks", authenticateJWT, asyncHandler(getMyTasks));
router.get("/delayed", authenticateJWT, asyncHandler(getDelayedTasks));
router.get("/previous", authenticateJWT, asyncHandler(getPreviousTasks));
router.get(
  "/dashboard-aggregate",
  authenticateJWT,
  asyncHandler(getDashboardAggregates),
);
router.get(
  "/:id",
  authenticateJWT,
  asyncHandler(
    getTaskById as unknown as (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => Promise<any>,
  ),
);

router.patch(
  "/:taskId/status",
  authenticateJWT,
  asyncHandler(updateTaskStatus),
);

export default router;
