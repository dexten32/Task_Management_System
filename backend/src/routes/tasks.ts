// routes/task.ts
import express from "express";
import { createTask } from "../services/taskService";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { verifyToken } from "../utils/jwt";
import prisma from "../config/prisma";
import { TaskStatus } from "@prisma/client";

const router = express.Router();

router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, description, deadline, assignees } = req.body;

    if (!title || !description || !deadline || !assignees) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userId = req.user?.id; // Assuming the authenticated user is the one assigning the task
    if (!userId) {
      return res.status(400).json({ message: "Assigned by user ID is required." });
    }

    const task = await createTask({
      title,
      description,
      deadline: new Date(deadline),
      assignees,
      assignedBy: userId,
      status: TaskStatus.ACTIVE,
      priorityId: 1,
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
      where: {
        assignees: {
          some: {
            id: userId
          }
        }
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
});

export default router;
