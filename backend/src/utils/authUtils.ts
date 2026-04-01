import { User } from "@prisma/client";

/**
 * Validates if the current user (requester) has permission to perform an action on a target user based on department.
 * @param reqUser - The user making the request (from req.user).
 * @param targetUser - The user being acted upon.
 * @returns {boolean} - True if authorized, False otherwise.
 */
export const hasManagerAccess = (
  reqUser: { role: string; departmentId?: string | null },
  targetUser: { departmentId: string | null }
): boolean => {
  if (reqUser.role === "ADMIN") return true;
  if (reqUser.role === "MANAGER") {
    return !!(reqUser.departmentId && reqUser.departmentId === targetUser.departmentId);
  }
  return false;
};

/**
 * Validates if the requester can modify a user's role or department.
 */
export const canModifyUser = (
  reqUser: { role: string; departmentId?: string | null },
  targetDepartmentId: string | null,
  targetRole: string
): { authorized: boolean; error?: string } => {
  if (reqUser.role === "ADMIN") return { authorized: true };
  if (reqUser.role === "MANAGER") {
    if (targetDepartmentId !== reqUser.departmentId) {
      return { authorized: false, error: "Managers cannot change a user's department." };
    }
    if (targetRole === "ADMIN") {
      return { authorized: false, error: "Managers cannot promote users to Admin." };
    }
    return { authorized: true };
  }
  return { authorized: false, error: "Unauthorized." };
};
