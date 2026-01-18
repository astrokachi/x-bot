import { authorize, getToken, logout } from "./auth.controller.js";
import { Router } from "express";
import { validateAuthCallback, getTokenSchema } from "./auth.validation.js";

const router: Router = Router();

router.get("/authorize", authorize);
router.get("/callback", validateAuthCallback(getTokenSchema), getToken);
router.post("/logout", logout);

export default router;
