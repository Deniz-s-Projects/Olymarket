const dbClient = (process.env.DB_CLIENT || "postgres").toLowerCase();

export const dateTimeColumnType: "timestamp" | "datetime" =
  dbClient === "sqlite" ? "datetime" : "timestamp";
