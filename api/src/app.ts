import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import listingRoutes from "./routes/listings";
import conversationRoutes from "./routes/conversations";
import categoryRoutes from "./routes/categories";
import profileRoutes from "./routes/profile";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/listings", listingRoutes);
app.use("/conversations", conversationRoutes);
app.use("/categories", categoryRoutes);
app.use("/profile", profileRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
