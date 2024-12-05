import { Request, Response } from "express";

import redisClient from "../config/redis";

const getHome = async (req: Request, res: Response): Promise<void> => {
  res.render("home");
};

const getMap = async (req: Request, res: Response): Promise<void> => {
  res.render("map");
};

const getMysqlData = async (req: Request, res: Response): Promise<void> => {};

const getRedisData = async (req: Request, res: Response): Promise<void> => {
  try {
    const value = await redisClient.get("kljuc");
    res.send(value);
  } catch (error) {
    console.error("Error getting data from Redis:", error);
    res.status(500).send("Error getting data from Redis");
  }
};

export default { getHome, getMap, getMysqlData, getRedisData };
