import { useEffect, useState } from "react";

export function usePendingUsers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5000/api/users/pending",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok)
          throw new Error("Failed to fetch pending user requests");
        const data = await response.json();
        setPendingUsers(data.users || []);
      } catch (error) {
        console.error("Failed to fetch pending users", error);
        setError("Failed to load pending user requests.");
      }
    };

    fetchPendingUsers();
  }, []);

  return { pendingUsers, error };
}
