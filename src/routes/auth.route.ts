import { authorize, getToken, logout } from "../controllers/auth.controller";
import { withControllerLogging } from "../middleware/controller-logger";
import { Router } from "express";

const router = Router();

router.get("/authorize", authorize);
router.get("/callback", getToken);
router.post("/logout", logout);

export default router;
