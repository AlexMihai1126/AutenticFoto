import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import logger from "../helpers/logger/loggerConfig";
const modulePrefix = "[Server/DB]";

const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}${process.env.MONGO_STR}`;

export async function connectMongoDb() {
  try {
    logger.info(`${modulePrefix} Inițializare MongoDB cloud...`);
    await mongoose.connect(MONGO_URI, {dbName: process.env.MONGO_DB});
    logger.info(`${modulePrefix} Conectat la MongoDB cloud.`);
  } catch (error) {
    logger.error(`${modulePrefix} Eroare inițializare MongoDB cloud: `, error);
    throw error;
  }
}
