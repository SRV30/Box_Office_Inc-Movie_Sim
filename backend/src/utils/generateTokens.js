import jwt from "jsonwebtoken";
import env from "../config/envConfig.js";

/**
 * Generates an Access Token for the user.
 */
export const generateAccessToken = (userId) => {
  if (!userId) throw new Error("userId is required to generate an access token");
  
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRE,
    algorithm: "HS256",
  });
};

/**
 * Generates a Refresh Token for the user.
 */
export const generateRefreshToken = (userId) => {
  if (!userId) throw new Error("userId is required to generate a refresh token");
  
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRE,
    algorithm: "HS256",
  });
};
