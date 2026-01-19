import express from "express";
import prisma from "../config/prisma";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

// GET /api/departments
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
    });
    res.json({ departments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

export default router;
