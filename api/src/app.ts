import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import listingRoutes from "./routes/listings";
import conversationRoutes from "./routes/conversations";
import categoryRoutes from "./routes/categories";
import profileRoutes from "./routes/profile";
import adminRoutes from "./routes/admin";
import groupRoutes from "./routes/groups";
import reportRoutes from "./routes/reports";
import offerRoutes from "./routes/offers";
import wantedListingRoutes from "./routes/wanted-listings";
import analyticsRoutes from "./routes/analytics";
import announcementRoutes from "./routes/announcements";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/auth", authRoutes);
app.use("/listings", listingRoutes);
app.use("/conversations", conversationRoutes);
app.use("/categories", categoryRoutes);
app.use("/profile", profileRoutes);
app.use("/admin", adminRoutes);
app.use("/groups", groupRoutes);
app.use("/reports", reportRoutes);
app.use("/offers", offerRoutes);
app.use("/wanted-listings", wantedListingRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/announcements", announcementRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
