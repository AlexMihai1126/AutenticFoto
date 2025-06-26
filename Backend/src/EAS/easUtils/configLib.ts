import * as fs from "node:fs";
import { EASLibConfig, EASSchema } from "./easInterfaces";
import logger from "../../helpers/logger/loggerConfig";
const modulePrefix = "[EASConfigLib]";

// instanta de tip singleton a configuratiei
let instance: EASLibConfig | null = null;
/**
 * Inițializează instanța singleton de configurare a librăriei.
 *
 * @param config - Obiect de configurare.
 */
export async function initializeLibConfig(config: EASLibConfig): Promise<void> {
  if (instance !== null) {
    logger.warn(`${modulePrefix} Configurația a fost deja inițializată`);
    return;
  }
  if (config.schemaRegisterMode == false) {
    try {
      const fileContent = await fs.promises.readFile(
        config.schemaJSONFile,
        "utf-8"
      );
      config.schemas = JSON.parse(fileContent) as Record<string, EASSchema>;
    } catch (error) {
      logger.error(`${modulePrefix} Eroare la citirea fișierului pentru EAS schemas:`, error);
      throw new Error("Eroare la citirea fișierului pentru EAS schemas.");
    }
  } // sare peste initializare scheme daca suntem in modul de inregistrare scheme
  instance = config;
}

/**
 * Preia instanța singleton de configurare a aplicației.
 * @throws {Error} Dacă nu s-a apelat `initializeAppConfig` înainte de apelul acestei funcții.
 */
export function getAppConfig(): EASLibConfig {
  if (instance === null) {
    logger.error(`${modulePrefix} Configurare neinițializată.`);
    throw new Error("Configurare neinițializată.");
  }
  return instance;
}
