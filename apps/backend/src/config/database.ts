import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/index.js";
import { config } from "./env.js";

const adapter = new PrismaPg({
  connectionString: config.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
export type Decimal = Prisma.Decimal;
export const Decimal = Prisma.Decimal;
