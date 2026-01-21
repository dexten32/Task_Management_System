import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getPriorities = async (req: Request, res: Response) => {
  try {
    const priorities = await prisma.priority.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        color: true,
      },
    });
    return res.status(200).json({ priorities });
  } catch (error) {
    console.error("Error fetching priorities: ", error);
    res.status(500).json({ message: "Failed to fetch priorities." });
  }
};
