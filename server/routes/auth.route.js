import express from "express"
import { googleAuth, logOut, updateProfile } from "../controllers/auth.controller.js"
import isAuth from "../middlewares/isAuth.js"

const authRouter = express.Router()

authRouter.post("/google", googleAuth)
authRouter.put("/profile", isAuth, updateProfile)
authRouter.get("/logout", logOut)

export default authRouter