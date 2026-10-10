import { PrismaClient } from "../generated/prisma/client.js";
import type { JsonObject } from "@prisma/client/runtime/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import "dotenv/config";

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("DATABASE_URL is not set in environment variables");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export const client = prisma;
export const prismaclient = prisma;

export default prisma;
export { PrismaClient };
export type { JsonObject };
export * from "../generated/prisma/client.js";
