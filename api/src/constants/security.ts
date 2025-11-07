import dotenv from "dotenv";

dotenv.config();

export const API_KEY_HEADER = "x-api-key";
export const API_KEY = process.env.API_KEY ?? "";
