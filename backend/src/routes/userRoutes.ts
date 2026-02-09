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
import prisma from "../config/prisma";

const router = express.Router();

// Helper to wrap async functions
const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
    (req, res, next) =>
      Promise.resolve(fn(req, res, next)).catch(next);

// Public routes
router.post("/signup", signup);
router.post("/login", login as RequestHandler);

// Authenticated routes
router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    let { department } = req.query;
    if (Array.isArray(department)) {
      department = department[0];
    }

    const where = department ? { department: { name: department } } : {};

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

router.get("/pending", authenticateJWT, getPendingUsers);
router.patch("/approve/:userId", authenticateJWT, approveUser);
router.delete("/decline/:userId", authenticateJWT, declineUser);
router.delete("/delete/:userId", authenticateJWT, deleteUser);
router.post("/logout", logout);
router.patch(
  "/update/:userId",
  authenticateJWT,
  asyncHandler(updateUser as unknown as RequestHandler)
);

router.post(
  "/create",
  authenticateJWT,
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
