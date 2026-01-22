import { Router } from "express";
import { getProfile } from "./user.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router: Router = Router();

router.get("/profile", authMiddleware, getProfile);

export default router;
