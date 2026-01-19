// components/UserRequestCard.tsx
"use client";

import { useState } from "react";

type User = {
  id: number;
  username: string;
  email: string;
  department: string;
  name: string;
};

export default function UserRequestCard({
  user,
  onAccept,
  onDecline,
}: {
  user: User;
  onAccept: (user: User) => void;
  onDecline: (user: User) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-white rounded-md shadow-sm cursor-pointer hover:bg-gray-200"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center p-3">
        <span className="font-medium text-gray-700">{user.username}</span>
        <span className="text-sm text-gray-500">{user.department}</span>
      </div>

      {expanded && (
        <div className="p-3 border-t">
          <p className="text-sm text-gray-600">Email: {user.email}</p>
          <p className="text-sm text-gray-600">Department: {user.department}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(user);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDecline(user);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
