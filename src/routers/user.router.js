import { Router } from "express";
import { createUser, getCurrentUser, loginUser, logout, updateAcessToken } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create").post(createUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logout)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-acess-token").post(updateAcessToken)
export default router