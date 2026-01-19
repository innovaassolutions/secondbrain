import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export { api };
