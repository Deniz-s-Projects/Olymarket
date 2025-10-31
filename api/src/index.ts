import "reflect-metadata";
import dotenv from "dotenv";
import app from "./app";
import { initializeDataSource } from "./config";
import { scheduleListingExpiryJob } from "./services/listingExpiry";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await initializeDataSource();
    scheduleListingExpiryJob();
    app.listen(PORT, () => {
      console.log(`API server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();
