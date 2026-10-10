import "dotenv/config";

export const JWT_PASSWORD = process.env.JWT_PASSWORD || "it is password";
export const PORT_PRIMARY_BACKEND = Number(process.env.PORT) || 3010;
export const PORT_HOOKS = Number(process.env.HOOKS_PORT) || 3011;

