const express = require("express");
const authController = require("../Controllers/auth.controllers")
const authMiddlewares = require("../Middlewares/auth.middlewares");

const authRouter = express.Router();

authRouter.post("/register" , authController.registerUser);

authRouter.post("/login" , authController.loginUser);

authRouter.get("/logout" , authController.logoutUser);

authRouter.get("/get-me" , authMiddlewares.authUser , authController.getUser)

module.exports = authRouter


