import express, { RequestHandler } from "express";
import {
  signup,
  login,
  createUser,
  getPendingUsers,
  approveUser,
  declineUser,
  deleteUser,
  updateUser,
  getCurrentUser,
  logout,
  getUsersFiltered,
  googleLogin,
} from "../controllers/userController";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { allowRoles } from "../middlewares/roleMiddleware";
import { authLimiter } from "../middlewares/rateLimiter";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

// Public routes
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login as RequestHandler);
router.post("/google-login", authLimiter, asyncHandler(googleLogin as unknown as RequestHandler));

// Authenticated routes
router.get(
  "/",
  authenticateJWT,
  asyncHandler(getUsersFiltered as unknown as RequestHandler)
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
