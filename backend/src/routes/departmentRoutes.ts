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

// POST /api/departments
// Removed authenticateJWT to allow creation while signing up before approval
router.post("/", authenticateJWT, async (req, res) => {
  // Use dynamically imported createDepartment to prevent issues if not defined
  try {
    const { createDepartment } = await import("../controllers/departmentController");
    await createDepartment(req, res);
  } catch (e) {
    console.error("Failed to load department controller", e);
    res.status(500).json({ error: "Server configuration error" });
  }
});

export default router;
