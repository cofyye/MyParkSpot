import express from "express";

import authController from "../controllers/authController";

const router = express.Router();

router.get("/login", authController.getLogin);
router.get("/register", authController.getRegister);

export default router;
