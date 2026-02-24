"use client";

import React, { useState, useEffect } from "react";
import MultiSelect from "./MultiSelect";
import API_BASE_URL from "@/lib/api";
import { Button } from "./ui/button";

interface User {
    id: string;
    name: string;
    role?: string;
    departmentId?: string | null;
}

interface TaskAssigneeEditorProps {
    taskId: string;
    currentAssignees: { id: string; name: string }[];
    token: string | null;
    isActive: boolean;
    onAssigneesUpdated: (newAssignees: { id: string; name: string }[]) => void;
}

export default function TaskAssigneeEditor({
    taskId,
    currentAssignees,
    token,
    isActive,
    onAssigneesUpdated,
}: TaskAssigneeEditorProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
        currentAssignees.map((a) => a.id)
    );
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedUserIds(currentAssignees.map((a) => a.id));
    }, [currentAssignees]);

    const decodeJwtToken = (token: string) => {
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join(""),
            );
            return JSON.parse(jsonPayload);
        } catch {
            return null;
        }
    };

    const decoded = token ? decodeJwtToken(token) : null;
    const canEdit = decoded && (decoded.role === "ADMIN" || decoded.role === "MANAGER") && isActive;
    const isAdmin = decoded?.role === "ADMIN";

    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const [usersRes, deptsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
                isAdmin ? fetch(`${API_BASE_URL}/api/departments`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null)
            ]);

            if (!usersRes.ok) throw new Error("Failed to load users");
            const usersData = await usersRes.json();

            let fetchedUsers = usersData.users || [];
            if (decoded?.role === "MANAGER") {
                fetchedUsers = fetchedUsers.filter((u: User) => u.role !== "MANAGER");
            }
            setUsers(fetchedUsers);

            if (deptsRes && deptsRes.ok) {
                const deptsData = await deptsRes.json();
                setDepartments(deptsData.departments || []);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
        if (users.length === 0) {
            fetchData();
        }
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setSelectedUserIds(currentAssignees.map((a) => a.id));
        setSelectedDeptId("all");
        setError(null);
    };

    const handleSaveClick = async () => {
        if (!token) return;
        setIsSaving(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/assignees`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ assignees: selectedUserIds }),
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to update assignees");
            }
            const data = await res.json();
            onAssigneesUpdated(data.task.assignees);
            setIsEditing(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!canEdit && currentAssignees.length === 0) return null;

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Assignees</h3>
                {canEdit && !isEditing && (
                    <button
                        onClick={handleEditClick}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                    {currentAssignees.length > 0 ? (
                        currentAssignees.map((assignee) => (
                            <div key={assignee.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                                    {assignee.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{assignee.name}</span>
                            </div>
                        ))
                    ) : (
                        <span className="text-sm text-slate-500 italic bg-slate-50 py-1.5 px-3 rounded-md border border-slate-100">No assignees yet.</span>
                    )}
                </div>
            ) : (
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                    {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded-md border border-red-100">{error}</p>}
                    {isLoading ? (
                        <p className="text-sm text-slate-500 animate-pulse">Loading available users...</p>
                    ) : (
                        <div className="space-y-4">
                            {isAdmin && departments.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Filter by Department</label>
                                    <select
                                        className="w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                                        value={selectedDeptId}
                                        onChange={(e) => setSelectedDeptId(e.target.value)}
                                    >
                                        <option value="all">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Select Users</label>
                                <MultiSelect
                                    options={users
                                        .filter(user => selectedDeptId === "all" || user.departmentId === selectedDeptId)
                                        .map((user) => ({
                                            id: user.id,
                                            name: `${user.name} (${user.role || 'EMPLOYEE'})`
                                        }))}
                                    selectedIds={selectedUserIds}
                                    onChange={setSelectedUserIds}
                                    placeholder="Search & select assignees..."
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" size="sm" className="h-9 px-4 text-sm" onClick={handleCancelClick} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button size="sm" className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center text-center" onClick={handleSaveClick} disabled={isSaving || isLoading}>
                            {isSaving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
