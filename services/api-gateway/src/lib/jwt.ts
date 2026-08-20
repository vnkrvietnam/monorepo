import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET ?? "change_me_in_production";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET ?? "change_refresh_me";
const ACCESS_EXPIRE = process.env.JWT_EXPIRE ?? "15m";
const REFRESH_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE ?? "7d";

export interface JWTPayload {
  sub: string;      // userId
  role: "user" | "admin" | "compliance";
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRE } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRE } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
}
