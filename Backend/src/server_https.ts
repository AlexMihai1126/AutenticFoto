/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { connectMongoDb } from "./DB/mongoConfig";
import cors from "cors";
import { initGCS } from "./GCS/gcsConfig";
const modulePrefix = "[Server/Main]";
import fs from "fs";
import https from "https";
import helmet from "helmet";
import enforce from "express-sslify";
import userRoutes from "./routes/userRouter";
import fileRoutes from "./routes/filesRouter";
import authRoutes from "./routes/authRouter";
import adminRoutes from "./routes/adminRouter";
import mainRoutes from "./routes/mainRouter";
import delegatedAttestRoutes from "./routes/blockchainRouter";
import blockchainSecureRoutes from "./routes/blockchainListenerRouter";
import photographerRoutes from "./routes/photographerRouter";
import dotenv from "dotenv";
import { initializeLibConfig } from "./EAS/easUtils/configLib";
import { EASLibConfig } from "./EAS/easUtils/easInterfaces";
import logger from "./helpers/logger/loggerConfig";
import multer from "multer";
dotenv.config();

const whitelistedDomains = ["https://localhost:3000"];

const corsOptions = {
  origin: (
    origin: any,
    callback: (err: Error | null, allow: boolean) => void
  ) => {
    if (!origin) {
      return callback(null, true);
    }
    if (whitelistedDomains.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(
        `Politică CORS: originea ${origin} nu este permisă să acceseze această resursă.`
      ),
      false
    );
  },

  methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
  credentials: true,
};

const app = express();

app.use(enforce.HTTPS({ trustProtoHeader: true }));

app.use(
  helmet({
    hsts: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: any, res: any, next: any) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api/user", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blockchain", delegatedAttestRoutes);
app.use("/api/main", mainRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blockchain-secure", blockchainSecureRoutes);
app.use("/api/user/photographer", photographerRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Fișierul nu poate depăși 20MB." });
  }
  next(err);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(`Excepție netratată în ${req.method} | ${req.originalUrl} `, err);
  res.status(500).json({ message: "Eroare server" });
});

const sslKeyPath = process.env.SSL_KEY_PATH ?? "";
const sslCertificatePath = process.env.SSL_CERT_PATH ?? "";

const sslOptions = {
  key: fs.readFileSync(sslKeyPath),
  cert: fs.readFileSync(sslCertificatePath),
};

const httpsPort = Number(process.env.HTTPS_PORT) || 443;

async function startup() {
  try {
    logger.info(`${modulePrefix} Pornire server backend HTTPS...`);
    await connectMongoDb();

    await initGCS();

    const easConfig: EASLibConfig = {
      ownerPrivateKey: process.env.OWNER_PK!,
      rpcUrlMain: process.env.RPC_URL_MAIN!,
      rpcUrlBackup: process.env.RPC_URL_BACKUP!,
      easContractAddress: process.env.EAS_CONTRACT_ADDR!,
      schemaRegistryContractAddress: process.env.SCHEMAREGISTRY_CONTRACT_ADDR!,
      schemaJSONFile: process.env.SCHEMAS_JSON!,
      schemaRegisterMode: false,
      photoPurchaseSchema: process.env.PHOTOS_PURCHASE_SCHEMA_NAME!,
      userRegSchema: process.env.USER_SCHEMA_NAME!,
      photoRegSchema: process.env.PHOTOS_REG_SCHEMA_NAME!,
    };

    await initializeLibConfig(easConfig);

    https.createServer(sslOptions, app).listen(httpsPort, () => {
      logger.info(`${modulePrefix} API HTTPS pornit, port ${httpsPort}`);
      console.log(`${modulePrefix} Serverul a pornit.`);
    });
  } catch (error) {
    logger.error(`${modulePrefix} Eroare la inițializare:`, error);
    console.error(
      `${modulePrefix} Eroare la inițializare, verifică log-urile.`
    );
    process.exit(1);
  }
}

startup();
