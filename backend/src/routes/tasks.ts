// routes/task.ts
import express from "express";
import { createTask } from "../services/taskService";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { verifyToken } from "../utils/jwt";
import prisma from "../config/prisma";

const router = express.Router();

router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, description, deadline, assignedTo } = req.body;

    if (!title || !description || !deadline || !assignedTo) {
      res.status(400).json({ message: "All fields are required." });
      return;
    }

    const assignedBy = req.user?.id;
    if (!assignedBy) {
      res.status(400).json({ message: "Assigned by user ID is required." });
      return;
    }
    const task = await createTask({
      title,
      description,
      deadline,
      assignedTo,
      assignedBy,
    });
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task." });
  }
});
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { assignedToId: userId },
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
});

export default router;
