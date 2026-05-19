import { Request, Response } from "express";
import {
  loginUser,
  registerUser,
  getAllUsersFromDB,
  getPendingUsersFromDB,
  getUserById,
  approveUserInDB,
  deleteUserInDB,
  updateUserInDB,
  getUserWithDeptFlow,
} from "../services/userService";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import prisma from "../config/prisma";
import { Role } from "@prisma/client";
import { verifyToken } from "../utils/jwt";
import { hasManagerAccess, canModifyUser } from "../utils/authUtils";
import { OAuth2Client } from "google-auth-library";
import bcryptjs from "bcryptjs";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

dotenv.config();

type UserForToken = {
  id: string;
  email: string;
  role: string;
  approved: boolean;
  departmentId?: string | null;
};

// Signup
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, approved, departmentId } = req.body;
    const user = await registerUser(name, email, password, role, approved, departmentId);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Create User (Admin/Manager)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, departmentId } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const reqUser = req.user as UserForToken;
    let finalDepartmentId = departmentId;
    if (reqUser?.role === "MANAGER" && reqUser?.departmentId) {
      finalDepartmentId = reqUser.departmentId;
    }

    const user = await registerUser(name, email, password, role, true, finalDepartmentId);
    const userWithDept = await getUserWithDeptFlow(user.id);
    res.status(201).json(userWithDept);
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(400).json({ message: error.message || "Failed to create user" });
  }
};

const loginFails = new Map<string, { attempts: number, expiry: number }>();

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase() : "";

    // Apply progressive delay if needed
    const failData = loginFails.get(normalizedEmail);
    if (failData) {
      if (Date.now() > failData.expiry) {
        loginFails.delete(normalizedEmail);
      } else {
        const delayMs = Math.min(failData.attempts * 1000, 15000);
        if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const user = await loginUser(email, password);

    if (!user) {
      const attempts = (failData?.attempts || 0) + 1;
      loginFails.set(normalizedEmail, { attempts, expiry: Date.now() + 900 * 1000 });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    loginFails.delete(normalizedEmail);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, approved: user.approved, departmentId: user.departmentId },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({ user, token });
  } catch (error: any) {
    res.status(401).json({ message: error.message || "Login failed" });
  }
};

// Google Login
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (e) {
      // Fallback for access_token from useGoogleLogin
      const axios = require("axios");
      const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      });
      payload = data;
    }
    
    if (!payload || !payload.email) return res.status(401).json({ message: "Invalid Google token" });

    const email = payload.email!;
    const name = payload.name || "Google User";

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = await bcryptjs.hash(Math.random().toString(36).slice(-12), 10);
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: randomPassword,
          role: "EMPLOYEE",
          approved: false, // Default to false for security
        }
      });
      return res.status(403).json({ message: "Account created but pending admin approval" });
    }

    if (!user.approved) {
      return res.status(403).json({ message: "Account pending approval" });
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, approved: user.approved, departmentId: user.departmentId },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({ user, token: jwtToken });
  } catch (error: any) {
    res.status(401).json({ message: error.message || "Google Login failed" });
  }
};

export const getUsersFiltered = async (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  const userDeptId = (req as any).user?.departmentId;

  let { department } = req.query;
  if (Array.isArray(department)) department = department[0];

  let where: any = department ? { department: { name: department } } : {};
  if (userRole === "MANAGER") where = { ...where, departmentId: userDeptId };

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
    ...user,
    department: user.department || null,
  }));

  res.json({ users: formattedUsers });
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersFromDB();
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const reqUser = req.user as UserForToken;
    const whereClause: any = { approved: false };
    if (reqUser?.role === "MANAGER") whereClause.departmentId = reqUser.departmentId;

    const pendingUsers = await getPendingUsersFromDB(whereClause);
    res.status(200).json({ users: pendingUsers });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch pending users", error: error.message });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const targetUser = await getUserById(userId);
    if (!targetUser || !hasManagerAccess(req.user as any, targetUser)) {
      return res.status(403).json({ message: "Forbidden: Access denied." });
    }

    const updatedUser = await approveUserInDB(userId);
    res.status(200).json({ message: "User approved successfully", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to approve user", error: error.message });
  }
};

export const declineUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const targetUser = await getUserById(userId);
    if (!targetUser || !hasManagerAccess(req.user as any, targetUser)) {
      return res.status(403).json({ message: "Forbidden: Access denied." });
    }

    await deleteUserInDB(userId);
    res.status(200).json({ message: "User declined successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to decline user", error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const targetUser = await getUserById(userId);
    if (!targetUser || !hasManagerAccess(req.user as any, targetUser)) {
      return res.status(403).json({ message: "Forbidden: Access denied." });
    }

    await deleteUserInDB(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { departmentId, role } = req.body;

  if (!departmentId || !role) {
    return res.status(400).json({ message: "Both departmentId and role are required." });
  }

  try {
    const targetUser = await getUserById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const modCheck = canModifyUser(req.user as any, departmentId, role);
    if (!modCheck.authorized) return res.status(403).json({ message: modCheck.error });

    const updatedUser = await updateUserInDB(userId, { departmentId, role });
    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAvailableRoles = (req: Request, res: Response) => {
  try {
    const roles = Object.values(Role).map((role) => ({ id: role, name: role }));
    res.status(200).json({ roles });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch roles", error: error.message });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = verifyToken(authHeader.split(" ")[1]);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, departmentId: true },
    });
    return user ? res.json(user) : res.status(404).json({ message: "User not found" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token", { path: "/" });
  res.status(200).json({ message: "Logged out successfully" });
};
