import crypto from "node:crypto";

import jwt from "jsonwebtoken";

import env from "../../config/envConfig.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenGenerator.js";

export const REFRESH_COOKIE_NAME = "refreshToken";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const getAccessTokenExpiresAt = (token) => {
  const decoded = jwt.decode(token);

  return decoded?.exp ? decoded.exp * 1000 : null;
};

export const createAuthTokenBundle = (userId) => {
  const token = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  return {
    token,
    refreshToken,
    accessTokenExpiresAt: getAccessTokenExpiresAt(token),
  };
};

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: REFRESH_TOKEN_TTL_MS,
  path: "/api/auth",
});

export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
};

export const clearRefreshTokenCookie = (res) => {
  const cookieOptions = getRefreshCookieOptions();
  delete cookieOptions.maxAge;

  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
};

export const verifyRefreshToken = (refreshToken) =>
  jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

export const decodeRefreshToken = (refreshToken) => jwt.decode(refreshToken);
