import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupAdminFetchInterceptor } from "./lib/adminAuth";
import { connectRealtime } from "./lib/realtime";

// Inject admin token into all /api/admin/* fetch calls automatically
setupAdminFetchInterceptor();

// Start real-time connection for auto-refresh on data changes
connectRealtime();

createRoot(document.getElementById("root")!).render(<App />);
