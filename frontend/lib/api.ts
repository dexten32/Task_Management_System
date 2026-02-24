// apiConfig.js

// Hardcoded to strictly prevent Next.js from routing fetches locally
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
console.log("RUNTIME API_BASE_URL IS:", API_BASE_URL);

export default API_BASE_URL;
