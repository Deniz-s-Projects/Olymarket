import "reflect-metadata";
import path from "node:path";
import { DataSource, DataSourceOptions } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

const entitiesPath = path.join(__dirname, "entities", "*.{ts,js}");
const migrationsPath = path.join(__dirname, "migrations", "*.{ts,js}");

const postgresOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [entitiesPath],
  migrations: [migrationsPath],
  synchronize: false,
  logging: false,
};

const sqliteOptions: DataSourceOptions = {
  type: "sqlite",
  database: process.env.SQLITE_DATABASE || ":memory:",
  entities: [entitiesPath],
  migrations: [],
  synchronize: true,
  logging: false,
};

const isPostgresConfigAvailable = Boolean(
  process.env.DATABASE_HOST &&
    process.env.DATABASE_USER &&
    process.env.DATABASE_NAME
);

const configuredClient = isPostgresConfigAvailable ? "postgres" : "sqlite";
process.env.DB_CLIENT = configuredClient;

if (!isPostgresConfigAvailable) {
  console.warn(
    "PostgreSQL configuration not found. Falling back to in-memory SQLite database."
  );
}

export let AppDataSource = new DataSource(
  isPostgresConfigAvailable ? postgresOptions : sqliteOptions
);

export async function initializeDataSource() {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  try {
    await AppDataSource.initialize();
    return AppDataSource;
  } catch (error) {
    throw error;
  }
}
