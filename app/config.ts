// config.ts
const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || "main";
export const DASHBOARD_MODE = branch === "demo" ? "demo" : "live";
