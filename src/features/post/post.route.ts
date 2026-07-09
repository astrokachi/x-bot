import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import { upload, validatePost } from "./post.validation.js";
import { publishPost } from "./post.controller.js";

const router: Router = Router();

router.post("/", authMiddleware, upload.single("image"), validatePost, publishPost);

export default router;
