import { authorize, getToken, logout, register, login } from "./auth.controller.js";
import { Router } from "express";
import { 
  validateAuthCallback, 
  validateBody, 
  registerSchema, 
  loginSchema
} from "./auth.validation.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router: Router = Router();

// Protect authorize endpoint - user must be logged in to connect X account
router.get("/authorize", authMiddleware, authorize);
router.get("/callback", validateAuthCallback, getToken);
router.post("/logout", authMiddleware, logout);
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

export default router;
