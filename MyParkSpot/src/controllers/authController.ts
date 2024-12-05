import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";

const getLogin = async (req: Request, res: Response): Promise<void> => {
  res.render("pages/auth/login");
};

const getRegister = async (req: Request, res: Response): Promise<void> => {
  res.render("pages/auth/register");
};

export default { getLogin, getRegister };
