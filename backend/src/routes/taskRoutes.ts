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
  updateTaskAssignees,
} from "../controllers/taskController";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { allowRoles } from "../middlewares/roleMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

// POST /api/tasks/assign
router.post("/assign", authenticateJWT, allowRoles("ADMIN", "MANAGER"), asyncHandler(assignTask));

// GET /api/tasks
router.get("/", authenticateJWT, asyncHandler(getTasksController));

// Additional routes
router.get("/recent", authenticateJWT, asyncHandler(getRecentTasks));
router.get("/recentlimit", authenticateJWT, asyncHandler(getTaskLimit));
router.get("/next-id", authenticateJWT, asyncHandler(getNextTaskId));
router.get("/my-tasks", authenticateJWT, asyncHandler(getMyTasks));
router.get("/delayed", authenticateJWT, asyncHandler(getDelayedTasks));
router.get("/previous", authenticateJWT, asyncHandler(getPreviousTasks));
router.get("/dashboard-aggregate", authenticateJWT, asyncHandler(getDashboardAggregates));

router.get("/:id", authenticateJWT, asyncHandler(getTaskById as any));

router.patch("/:taskId/status", authenticateJWT, asyncHandler(updateTaskStatus));

// UPDATE ASSIGNEES
router.patch("/:taskId/assignees", authenticateJWT, allowRoles("ADMIN", "MANAGER"), asyncHandler(updateTaskAssignees));

export default router;
