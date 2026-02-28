import * as dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Note: A real warm-up script would need to authenticate to fetch user-specific tasks.
// Since getRecentTasks and getMyTasks rely on req.user.id, we require an admin token.
// For this script, we'll demonstrate the concept. You must provide a valid JWT token.

const ADMIN_JWT = process.env.TEST_ADMIN_JWT || "replace_with_valid_jwt_token_for_load_test";

async function warmCache() {
    console.log(`Starting cache warm-up against ${API_BASE_URL}...`);

    try {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ADMIN_JWT}`
        };

        // 1. Warm up Recent Tasks (Page 1)
        console.log("Warming up /api/tasks/recent (page=1, limit=10)...");
        const recentRes = await fetch(`${API_BASE_URL}/api/tasks/recent?page=1&limit=10`, { headers });
        if (recentRes.ok) {
            console.log("✅ /api/tasks/recent cache warmed.");
        } else {
            console.warn("⚠️ Failed to warm /api/tasks/recent. Status:", recentRes.status);
        }

        // 2. Warm up My Tasks (Page 1)
        console.log("Warming up /api/tasks/my-tasks (page=1, limit=10)...");
        const myTasksRes = await fetch(`${API_BASE_URL}/api/tasks/my-tasks?page=1&limit=10`, { headers });
        if (myTasksRes.ok) {
            console.log("✅ /api/tasks/my-tasks cache warmed.");
        } else {
            console.warn("⚠️ Failed to warm /api/tasks/my-tasks. Status:", myTasksRes.status);
        }

        console.log("Cache warm-up complete!");
    } catch (error) {
        console.error("Error during cache warm-up:", error);
    }
}

warmCache();
