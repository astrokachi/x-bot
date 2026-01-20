import { authorize, getToken, logout, register, login } from "./auth.controller.js";
import { Router } from "express";
import { validateAuthCallback, getTokenSchema, validateBody, registerSchema, loginSchema } from "./auth.validation.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router: Router = Router();

router.get("/authorize", authorize);
router.get("/callback", validateAuthCallback(getTokenSchema), getToken);
router.post("/logout", authMiddleware, logout);
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

export default router;
