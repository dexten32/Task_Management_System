import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addLog = async (req: Request, res: Response) => {
  const { taskId, description } = req.body; // Expect taskId and description

  if (!taskId || !description) {
    return res
      .status(400)
      .json({ message: "Task ID and description are required." });
  }

  try {
    const newLog = await prisma.taskLog.create({
      data: {
        taskId,
        description,
      },
    });
    res.status(201).json(newLog);
  } catch (error) {
    console.error("Failed to add log:", error);
    res.status(500).json({ message: "Error adding log" });
  }
};
