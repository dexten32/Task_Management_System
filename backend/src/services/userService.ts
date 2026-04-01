import prisma from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/hashPassword";

import dotenv from "dotenv";


dotenv.config();

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: "ADMIN" | "EMPLOYEE" = "EMPLOYEE",
  approved: boolean = false,
  departmentId?: string
) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role,
      approved,
      departmentId:
        departmentId && departmentId.trim() !== "" ? departmentId : null,
    },
  });

  const { password: _pass, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.password) {
    throw new Error("Password not set for this user");
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }
  if (user.approved !== true) {
    throw new Error("User not approved by admin yet");
  }


  const { password: _pass, ...userWithoutPassword } = user;
  return userWithoutPassword; 
};

export const getAllUsersFromDB = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        departmentId: true,
        department: true, // Include department name
      },
    });
    return users;
  } catch (error: any) {
    console.error("Error fetching all users from DB:", error);
    throw new Error("Failed to fetch users from the database");
  }
};

export const getPendingUsersFromDB = async (whereClause: any) => {
  return await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
  });
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({ where: { id } });
};

export const approveUserInDB = async (userId: string) => {
  return await prisma.user.update({
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
};

export const deleteUserInDB = async (userId: string) => {
  return await prisma.user.delete({
    where: { id: userId },
  });
};

export const updateUserInDB = async (userId: string, data: { departmentId: string; role: any }) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      department: true,
    },
  });
};

export const getUserWithDeptFlow = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};
