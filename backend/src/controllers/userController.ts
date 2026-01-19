import { Request, Response } from "express";
import {
  loginUser,
  registerUser,
  getAllUsersFromDB,
} from "../services/userService"; // Corrected import
// Import the User type/interface
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// Assuming 'User' from 'next-auth' is a base type, consider if you truly need it here,
// or if your Prisma User type is sufficient.
// If your userService.ts's loginUser already returns a specific user object,
// you might not need to import User from 'next-auth' here.
// For now, I'll keep the CustomUser type.
import { User as NextAuthUser } from "next-auth"; // Renamed to avoid conflict if Prisma User is used
import prisma from "../config/prisma";
import { Prisma, Role } from "@prisma/client";
import { verifyToken } from "../utils/jwt";

// Define a custom User type with 'role' and 'id' as these are essential for the token payload
// and are likely properties on the user object returned by loginUser.
// If loginUser returns a Prisma User, you can directly use Prisma.UserGetPayload<...>

type UserForToken = {
  id: string;
  email: string;
  role: string;
  approved: boolean;
};

dotenv.config();

// Signup
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, approved, departmentId } = req.body;
    const user = await registerUser(
      name,
      email,
      password,
      role,
      approved,
      departmentId
    );
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await loginUser(email, password);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (
      !user.role ||
      (user.role.toLowerCase() !== "admin" &&
        user.role.toLowerCase() !== "employee" &&
        user.role.toLowerCase() !== "manager") // Added manager based on your schema
    ) {
      return res.status(403).json({
        message: `Unauthorized user role: ${user.role.toLowerCase()}`,
      });
    }

    // Now, generate the JWT token in the controller
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        approved: user.approved,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    console.log(
      "Backend: Generated JWT Token:",
      token.substring(0, 30) + "..."
    ); // Log first 30 chars
    console.log("Backend: Attempting to set 'token' cookie.");

    // Set the token as an HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      path: "/", // Make the cookie available across the entire domain
    });

    console.log("Backend: 'token' cookie setting call completed.");

    // Send user data and token in JSON response for client-side localStorage as well
    res.status(200).json({ user, token });
    console.log("Backend: Login response sent.");
  } catch (error: any) {
    console.error("Backend: Error during login:", error.message);
    res.status(401).json({ message: error.message || "Login failed" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersFromDB();
    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};

export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        approved: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });
    res.status(200).json({ users: pendingUsers });
  } catch (error: any) {
    console.error("Error fetching pending users:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch pending users", error: error.message });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { approved: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });

    res
      .status(200)
      .json({ message: "User approved successfully", user: updatedUser });
  } catch (error: any) {
    console.error("Error approving user:", error);
    res
      .status(500)
      .json({ message: "Failed to approve user", error: error.message });
  }
};

export const declineUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    res.status(200).json({ message: "User declined successfully" });
  } catch (error: any) {
    console.error("Error declining user:", error);
    res
      .status(500)
      .json({ message: "Failed to decline user", error: error.message });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Failed to delete user", error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { departmentId, role } = req.body;

  if (!departmentId || !role) {
    return res
      .status(400)
      .json({ message: "Both departmentId and role are required." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        departmentId,
        role,
      },
      include: {
        department: true, // this will return department name
      },
    });

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAvailableRoles = (req: Request, res: Response) => {
  try {
    const rolesEnum = Object.values(Role);
    const roles = rolesEnum.map((role) => ({
      id: role,
      name: role,
    }));
    res.status(200).json({ roles });
  } catch (error: any) {
    console.error("Error fetching available roles:", error);
    res.status(500).json({
      message: "Failed to fetch available roles",
      error: error.message,
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Assuming verifyToken correctly decodes and validates the token
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    // Catch errors from jwt.verify if token is invalid/expired
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  // To effectively log out when using HttpOnly cookies, clear the cookie.
  res.clearCookie("token", { path: "/" });
  res.status(200).json({ message: "Logged out successfully" });
};
