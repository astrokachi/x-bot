import { redirectToTwitterAuth, OAuthCallback, logout, refreshAccessToken } from "./auth.controller.js";
import { Router } from "express";
import {
  validateAuthCallback,
} from "./auth.validation.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router: Router = Router();

// Protect authorize endpoint - user must be logged in to connect X account
router.get("/authorize", redirectToTwitterAuth);
router.get("/callback", validateAuthCallback, OAuthCallback);
router.post("/logout", authMiddleware, logout);
router.post("/refresh", refreshAccessToken);

export default router;
