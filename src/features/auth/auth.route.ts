import { authorize, getToken, logout } from "./auth.controller.js";
import { Router } from "express";

const router: Router = Router();

router.get("/authorize", authorize);
router.get("/callback", getToken);
router.post("/logout", logout);

export default router;
