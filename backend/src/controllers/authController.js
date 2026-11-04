import User from "../models/User.js";
import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import MarketDirector from "../models/MarketDirector.js";
import MarketActor from "../models/MarketActor.js";
import MarketCrewTeam from "../models/MarketCrewTeam.js";
import { hashPassword, comparePassword } from "../services/auth/authService.js";
import { generateDirectors } from "../services/director/directorGenerator.js";
import { generateActors } from "../services/actor/actorGenerator.js";
import { generateCrewTeams } from "../services/crew/crewGenerator.js";
import {
  AUTH_EVENTS,
  getAuthDiagnosticsForUser,
  recordAuthEvent,
} from "../services/auth/authMonitoringService.js";

import {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
  clearRefreshTokenCookie,
  decodeRefreshToken,
  createAuthTokenBundle,
  hashRefreshToken,
  setRefreshTokenCookie,
  verifyRefreshToken,
} from "../services/auth/tokenService.js";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const isJwtRefreshError = (error) =>
  error.name === "TokenExpiredError" || error.name === "JsonWebTokenError";

const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  await User.updateOne(
    { "refreshTokens.tokenHash": tokenHash },
    { $pull: { refreshTokens: { tokenHash } } },
  );
};

const sanitizeUser = (user) => {
  const userObject = user.toObject ? user.toObject() : user;
  delete userObject.password;
  delete userObject.refreshTokens;
  return userObject;
};

const persistRefreshToken = async (user, refreshToken) => {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  user.refreshTokens = [
    ...(user.refreshTokens || []).filter(
      (session) => session.expiresAt && session.expiresAt > new Date(),
    ),
    {
      tokenHash: hashRefreshToken(refreshToken),
      createdAt: new Date(),
      expiresAt,
    },
  ];

  await user.save();
};

const issueAuthTokens = async (res, user) => {
  const tokenBundle = createAuthTokenBundle(user._id);

  await persistRefreshToken(user, tokenBundle.refreshToken);
  setRefreshTokenCookie(res, tokenBundle.refreshToken);

  return tokenBundle;
};

export const register = async (req, res) => {
  try {
    const { username, email, password, studioName } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,

    });

    const studio = await Studio.create({
      owner: user._id,
      name: studioName || `${username} Studios`,
    });

    await GameState.create({
      user: user._id,
    });

    // Populate separate market talent collections (issue #188)
    await MarketDirector.insertMany(
      generateDirectors(50).map((d) => ({ ...d, userId: user._id }))
    );
    await MarketActor.insertMany(
      generateActors(100).map((a) => ({ ...a, userId: user._id }))
    );
    await MarketCrewTeam.insertMany(
      generateCrewTeams(25).map((c) => ({ ...c, userId: user._id }))
    );

    user.studio = studio._id;
    await user.save();

    const tokenBundle = await issueAuthTokens(res, user);

    await recordAuthEvent(req, {
      user: user._id,
      eventType: AUTH_EVENTS.LOGIN_SUCCESS,
      reason: "REGISTER_AUTO_LOGIN",
      identifier: email,
    });

    res.status(201).json({
      success: true,
      token: tokenBundle.token,
      accessTokenExpiresAt: tokenBundle.accessTokenExpiresAt,
      user: sanitizeUser(user),
      studio,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      await recordAuthEvent(req, {
        eventType: AUTH_EVENTS.LOGIN_FAILURE,
        reason: "USER_NOT_FOUND",
        identifier: email,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.isDisabled) {
      await recordAuthEvent(req, {
        user: user._id,
        eventType: AUTH_EVENTS.LOGIN_FAILURE,
        reason: "ACCOUNT_DISABLED",
        identifier: email,
      });

      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DISABLED",
        message: "Account disabled",
      });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      await recordAuthEvent(req, {
        user: user._id,
        eventType: AUTH_EVENTS.LOGIN_FAILURE,
        reason: "INVALID_PASSWORD",
        identifier: email,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const tokenBundle = await issueAuthTokens(res, user);
    const populatedUser = await User.findById(user._id)
      .select("-password -refreshTokens")
      .populate("studio")
      .lean();

    const gameState = await GameState.findOne({ user: user._id }).select("currentWeek").lean();
    if (populatedUser && gameState) {
        populatedUser.currentWeek = gameState.currentWeek;
    }

    await recordAuthEvent(req, {
      user: user._id,
      eventType: AUTH_EVENTS.LOGIN_SUCCESS,
      reason: "PASSWORD_LOGIN",
      identifier: email,
    });

    res.status(200).json({
      success: true,
      token: tokenBundle.token,
      accessTokenExpiresAt: tokenBundle.accessTokenExpiresAt,
      user: populatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const refreshSession = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  try {

    if (!refreshToken) {
      await recordAuthEvent(req, {
        eventType: AUTH_EVENTS.TOKEN_REFRESH_FAILURE,
        reason: "REFRESH_TOKEN_MISSING",
      });

      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      await recordAuthEvent(req, {
        user: decoded.userId,
        eventType: AUTH_EVENTS.TOKEN_REFRESH_FAILURE,
        reason: "REFRESH_USER_NOT_FOUND",
      });
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: "Invalid refresh session",
      });
    }

    if (user.isDisabled) {
      await recordAuthEvent(req, {
        user: user._id,
        eventType: AUTH_EVENTS.SESSION_EXPIRED,
        reason: "ACCOUNT_DISABLED",
      });

      await revokeRefreshToken(refreshToken);
      clearRefreshTokenCookie(res);

      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DISABLED",
        message: "Account disabled",
      });
    }

    const now = new Date();
    const matchingSession = user.refreshTokens?.find(
      (session) => session.tokenHash === tokenHash && session.expiresAt > now,
    );

    if (!matchingSession) {
      await recordAuthEvent(req, {
        user: user._id,
        eventType: AUTH_EVENTS.SESSION_EXPIRED,
        reason: "REFRESH_SESSION_NOT_FOUND_OR_EXPIRED",
      });

      user.refreshTokens = (user.refreshTokens || []).filter(
        (session) => session.expiresAt && session.expiresAt > now,
      );
      await user.save();
      clearRefreshTokenCookie(res);

      return res.status(401).json({
        success: false,
        message: "Invalid refresh session",
      });
    }

    user.refreshTokens = (user.refreshTokens || []).filter(
      (session) => session.tokenHash !== tokenHash && session.expiresAt > now,
    );

    const tokenBundle = await issueAuthTokens(res, user);
    const refreshedUser = await User.findById(user._id)
      .select("-password -refreshTokens")
      .populate("studio");

    await recordAuthEvent(req, {
      user: user._id,
      eventType: AUTH_EVENTS.TOKEN_REFRESH_SUCCESS,
      reason: "ROTATED_REFRESH_TOKEN",
    });

    res.status(200).json({
      success: true,
      token: tokenBundle.token,
      accessTokenExpiresAt: tokenBundle.accessTokenExpiresAt,
      user: refreshedUser,
    });
  } catch (error) {
    if (isJwtRefreshError(error)) {
      const decodedRefreshToken = refreshToken
        ? decodeRefreshToken(refreshToken)
        : null;

      await recordAuthEvent(req, {
        user: decodedRefreshToken?.userId || null,
        eventType:
          error.name === "TokenExpiredError"
            ? AUTH_EVENTS.SESSION_EXPIRED
            : AUTH_EVENTS.TOKEN_REFRESH_FAILURE,
        reason: error.name,
      });

      clearRefreshTokenCookie(res);

      return res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_INVALID",
        message: "Invalid refresh token",
      });
    }

    await recordAuthEvent(req, {
      eventType: AUTH_EVENTS.TOKEN_REFRESH_FAILURE,
      reason: "REFRESH_SERVER_ERROR",
      metadata: { message: error.message },
    });

    return res.status(500).json({
      success: false,
      message: "Unable to refresh session",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    const decodedRefreshToken = refreshToken
      ? decodeRefreshToken(refreshToken)
      : null;

    await revokeRefreshToken(refreshToken);

    await recordAuthEvent(req, {
      user: decodedRefreshToken?.userId || req.user?._id || null,
      eventType: AUTH_EVENTS.LOGOUT,
      reason: "MANUAL_LOGOUT",
    });

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -refreshTokens")
      .populate("studio")
      .lean();

    const gameState = await GameState.findOne({ user: req.user._id }).select("currentWeek").lean();
    if (user && gameState) {
        user.currentWeek = gameState.currentWeek;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { token, studioName } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { email, name, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      if (user.isDisabled) {
        await recordAuthEvent(req, {
          user: user._id,
          eventType: AUTH_EVENTS.LOGIN_FAILURE,
          reason: "ACCOUNT_DISABLED",
          identifier: email,
        });
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DISABLED",
          message: "Account disabled",
        });
      }

      const tokenBundle = await issueAuthTokens(res, user);
      const populatedUser = await User.findById(user._id)
        .select("-password -refreshTokens")
        .populate("studio")
        .lean();

      const gameState = await GameState.findOne({ user: user._id }).select("currentWeek").lean();
      if (populatedUser && gameState) {
          populatedUser.currentWeek = gameState.currentWeek;
      }

      await recordAuthEvent(req, {
        user: user._id,
        eventType: AUTH_EVENTS.LOGIN_SUCCESS,
        reason: "GOOGLE_LOGIN",
        identifier: email,
      });

      return res.status(200).json({
        success: true,
        token: tokenBundle.token,
        accessTokenExpiresAt: tokenBundle.accessTokenExpiresAt,
        user: populatedUser,
      }); 
      
    } else {
      if (!studioName) {
        return res.status(202).json({ 
          requiresStudio: true, 
          message: "Please provide a studio name to complete registration." 
        });
      }

      user = await User.create({
        username: name || email.split('@')[0], 
        email,
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
        googleId,
        authProvider: 'google'
      });

      const studio = await Studio.create({
        owner: user._id,
        name: studioName,
      });

      await GameState.create({
        user: user._id,
      });

      await MarketDirector.insertMany(
        generateDirectors(50).map((d) => ({ ...d, userId: user._id }))
      );
      await MarketActor.insertMany(
        generateActors(100).map((a) => ({ ...a, userId: user._id }))
      );
      await MarketCrewTeam.insertMany(
        generateCrewTeams(25).map((c) => ({ ...c, userId: user._id }))
      );

      user.studio = studio._id;
      await user.save();

      const tokenBundle = await issueAuthTokens(res, user);

      await recordAuthEvent(req, {
        user: user._id,
        eventType: AUTH_EVENTS.LOGIN_SUCCESS,
        reason: "GOOGLE_REGISTER",
        identifier: email,
      });

      return res.status(201).json({
        success: true,
        token: tokenBundle.token,
        accessTokenExpiresAt: tokenBundle.accessTokenExpiresAt,
        user: sanitizeUser(user),
        studio,
      });
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Authentication failed. Token may be invalid." 
    });
  }
};

export const getAuthDiagnostics = async (req, res) => {
  try {
    const diagnostics = await getAuthDiagnosticsForUser(
      req.user._id,
      req.query.limit,
    );

    res.status(200).json({
      success: true,
      ...diagnostics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
