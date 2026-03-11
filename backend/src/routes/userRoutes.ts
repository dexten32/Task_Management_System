import express, { RequestHandler } from "express";
import {
  signup,
  login,
  createUser,
  getAllUsers,
  getPendingUsers,
  approveUser,
  declineUser,
  deleteUser,
  updateUser,
  getCurrentUser,
  logout,
} from "../controllers/userController";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { allowRoles } from "../middlewares/roleMiddleware";
import prisma from "../config/prisma";
import { authLimiter } from "../middlewares/rateLimiter";

const router = express.Router();

// Helper to wrap async functions
const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
    (req, res, next) =>
      Promise.resolve(fn(req, res, next)).catch(next);

// Public routes
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login as RequestHandler);

// Authenticated routes
router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userRole = (req as any).user?.role;
    const userDeptId = (req as any).user?.departmentId;

    let { department } = req.query;
    if (Array.isArray(department)) {
      department = department[0];
    }

    let where: any = department ? { department: { name: department } } : {};

    // If user is a MANAGER, force filter to their own department
    if (userRole === "MANAGER") {
      where = { ...where, departmentId: userDeptId };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        approved: true,
        role: true,
        email: true,
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      approved: user.approved,
      role: user.role,
      departmentId: user.departmentId || null,
      department: user.department
        ? { id: user.department.id, name: user.department.name }
        : null,

    }));

    res.json({ users: formattedUsers });
  })
);

router.get("/pending", authenticateJWT, allowRoles("ADMIN", "MANAGER"), getPendingUsers);
router.patch("/approve/:userId", authenticateJWT, allowRoles("ADMIN", "MANAGER"), approveUser);
router.delete("/decline/:userId", authenticateJWT, allowRoles("ADMIN", "MANAGER"), declineUser);
router.delete("/delete/:userId", authenticateJWT, allowRoles("ADMIN", "MANAGER"), deleteUser);
router.post("/logout", logout);
router.patch(
  "/update/:userId",
  authenticateJWT,
  allowRoles("ADMIN", "MANAGER"),
  asyncHandler(updateUser as unknown as RequestHandler)
);

router.post(
  "/create",
  authenticateJWT,
  allowRoles("ADMIN", "MANAGER"),
  asyncHandler(createUser as unknown as RequestHandler)
);

router.get("/profile", authenticateJWT, (req, res) => {
  if (req.user) {
    res.json({ message: `Hello user ${req.user.id}`, user: req.user });
  } else {
    res
      .status(401)
      .json({ message: "Unauthorized: user not found in request." });
  }
});

router.get(
  "/me",
  authenticateJWT,
  asyncHandler(getCurrentUser as unknown as RequestHandler)
);



export default router;
