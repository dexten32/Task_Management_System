import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany();
    res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Department name is required" });
    }

    const newDepartment = await prisma.department.create({
      data: { name },
    });

    res.status(201).json(newDepartment);
  } catch (error: any) {
    console.error("Error creating department:", error);

    // Check for unique constraint violation (P2002 in Prisma)
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Department with this name already exists" });
    }

    res.status(500).json({ message: "Failed to create department", error: error.message });
  }
};
