/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import UserModel from "../models/userModel";
import TransactionModel from "../models/transactionModel";
import bcrypt from "bcrypt";
import checkAuth from "../middleware/checkAuth";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import { attestUser } from "../EAS/easUtils/easUtils";
import {
  body,
  validationResult,
  matchedData,
  param,
  query,
} from "express-validator";
import logger from "../helpers/logger/loggerConfig";
import {
  sendConfirmationEmail,
  sendRegeneratedDownloadLink,
  sendWelcomeEmail,
} from "../nodemailer/nodemailerSender";
import generateNewDownloadLink, {
  getExistingLink,
} from "../helpers/generateDownloadLink";
import { Types } from "mongoose";
const modulePrefix = "[UserRoutes]";
dotenv.config();

const router = express.Router();

router.use(cookieParser());

const confirmValidatorMiddleware = [
  body("token")
    .exists()
    .withMessage("Token-ul este necesar.")
    .bail()
    .isUUID()
    .withMessage("Format token invalid."),
];

router.post(
  "/confirm",
  confirmValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = matchedData(req, { locations: ["body"] }) as {
      token: string;
    };

    try {
      const user = await UserModel.findOne({ confirmationToken: token });
      if (!user) {
        return res.status(400).json({ error: "Token invalid" });
      }
      if (user.confirmed) {
        return res.status(400).json({ error: "Contul este deja confirmat" });
      }

      user.confirmed = true;
      await user.save();
      return res.status(200).json({ message: "Email confirmat cu succes." });
    } catch (error) {
      logger.error(`${modulePrefix} eroare POST /confirm route:`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.get("/data", checkAuth, async (req: any, res: any) => {
  const userId = req.user.id;
  try {
    const user = await UserModel.findById(userId)
      .select(
        "email username walletAddress attestationUID blockchainConfirmed role type"
      )
      .lean();
    if (!user) {
      return res.status(404).json({ error: "Utilizatorul nu există." });
    }
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(`${modulePrefix} eroare GET /data :`, error);
    return res.status(500).json({ error: "Eroare server" });
  }
});

const newUserDataValidatorMiddleware = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Trebuie să fie un email valid.")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("username")
    .optional()
    .isAlphanumeric()
    .withMessage("Doar litere și cifre sunt permise.")
    .isLength({ min: 4, max: 20 })
    .withMessage("Lungimea trebuie să fie între 4 și 20 de caractere.")
    .trim()
    .escape(),
];

router.put(
  "/data",
  newUserDataValidatorMiddleware,
  checkAuth,
  async (req: any, res: any) => {
    const userId = req.user.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username } = matchedData(req, {
      locations: ["body"],
    }) as { email: string; username: string };

    try {
      const user = await UserModel.findById(userId).select(
        "email username confirmed"
      );
      if (!user) {
        return res.status(404).json({ error: "Utilizatorul nu există." });
      }

      const emailChanged = user.email !== email;
      const usernameChanged = user.username !== username;

      if (emailChanged) {
        const newToken = uuidv4();
        user.email = email;
        user.confirmationToken = newToken;
        user.confirmed = false;
        await sendConfirmationEmail(email, newToken);
      }

      if (usernameChanged) {
        user.username = username;
      }

      await user.save();

      return res.status(200).json({ message: "Date actualizate." });
    } catch (error) {
      logger.error(`${modulePrefix} eroare PUT /data :`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const changePasswordValidatorMiddleware = [
  body("currentPassword")
    .exists()
    .withMessage("Parola curentă este necesară.")
    .bail()
    .isString(),
  body("newPassword")
    .exists()
    .withMessage("Parola nouă este necesară.")
    .bail()
    .isString()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Parola nouă trebuie să conțină cel puțin 8 caractere, o majusculă, o literă mică, un număr și un simbol."
    ),
];

router.post(
  "/change-password",
  checkAuth,
  changePasswordValidatorMiddleware,
  async (req: any, res: any) => {
    const userId = req.user?.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = matchedData(req, {
      locations: ["body"],
    }) as { currentPassword: string; newPassword: string };

    try {
      const user = await UserModel.findById(userId).select("passwordHash");
      if (!user) {
        return res.status(404).json({ error: "Utilizatorul nu există." });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Parola curentă este greșită." });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      user.passwordHash = newHash;
      await user.save();

      return res.status(200).json({ message: "Parolă schimbată cu succes." });
    } catch (error) {
      logger.error(`${modulePrefix} Eroare POST /change-password :`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.get("/light-profile-data", checkAuth, async (req: any, res: any) => {
  const userId = req.user.id;
  try {
    const user = await UserModel.findById(userId)
      .select("username walletAddress role type")
      .lean();
    if (!user) {
      return res.status(404).json({ error: "Utilizator negăsit." });
    }
    return res.status(200).json({
      username: user.username,
      walletAddress: user.walletAddress,
      role: user.role,
      type: user.type,
    });
  } catch (error) {
    logger.error(`${modulePrefix} eroare GET /light-profile-data :`, error);
    return res.status(500).json({ error: "Eroare server" });
  }
});

const verifyWalletValidatorMiddleware = [
  body("wAddress")
    .exists()
    .withMessage("Adresa wallet este necesară.")
    .bail()
    .custom((addr: string) => ethers.isAddress(addr))
    .withMessage("Adresă wallet invalidă.")
    .bail()
    .customSanitizer((addr: string) => addr.toLowerCase()),
  body("message")
    .exists()
    .withMessage("Mesajul este necesar.")
    .bail()
    .isString(),
  body("signature")
    .exists()
    .withMessage("Semnătura este necesară.")
    .bail()
    .isString()
    .bail(),
];

router.post(
  "/verify-wallet",
  checkAuth,
  verifyWalletValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { wAddress, message, signature } = matchedData(req, {
      locations: ["body"],
    }) as { wAddress: string; message: string; signature: string };
    try {
      const userId = req.user?.id;
      const user = await UserModel.findById(userId);
      const walletExists = await UserModel.findOne({ walletAddress: wAddress })
        .select("walletAddress")
        .lean();
      if (walletExists) {
        return res
          .status(400)
          .json({ error: "Acest wallet a fost deja înregistrat." });
      }
      if (!user)
        return res.status(404).json({ error: "Utilizatorul nu există." });

      if (user.blockchainConfirmed) {
        return res.status(400).json({ error: "Wallet deja confirmat." });
      }

      const recovered = ethers.verifyMessage(message, signature);
      if (recovered.toLowerCase() !== wAddress.toLowerCase()) {
        return res
          .status(400)
          .json({ error: "Semnătura primită este invalidă." });
      }

      const isPhotographer = user.type === "seller" ? true : false;

      const attResult = await attestUser(wAddress, isPhotographer);
      if (attResult.error) {
        logger.warn(
          `Eroare creare atestare pentru ${wAddress}: ${attResult.error}`
        );
        return res.status(500).json({ error: "Eroare creare atestare" });
      }

      user.walletAddress = wAddress;
      user.attestationUID = attResult.data!;
      user.blockchainConfirmed = true;
      await user.save();

      const userType = user.type === "buyer" ? "buyer" : "seller";

      await sendWelcomeEmail(
        user.email,
        user.username,
        userType,
        user.walletAddress,
        user.attestationUID
      );

      res.status(200).json({ message: "Wallet verificat cu succes." });
    } catch (error) {
      logger.error(`${modulePrefix} eroare POST /verify-wallet :`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const myDataValidatorMiddleware = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page trebuie să fie un număr întreg ≥ 1")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage("limit trebuie să fie un număr întreg între 1 și 24")
    .toInt(),
];

router.get(
  "/my-transactions",
  checkAuth,
  myDataValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20 } = matchedData(req, {
      locations: ["query"],
      includeOptionals: true,
    }) as { page?: number; limit?: number };

    const userId = req.user?.id;
    const skip = (page - 1) * limit;

    try {
      const transactions = await TransactionModel.find({ userId })
        .select("generatedFileId attestationUID txHash createdAt")
        .populate("generatedFileId", "originalPhotoId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return res.status(200).json({ transactions });
    } catch (error) {
      logger.error(`${modulePrefix} eroare GET /my-transactions :`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const transactionDetailsValidatorMiddleware = [
  param("txId")
    .exists()
    .withMessage("txId este necesar")
    .bail()
    .isMongoId()
    .withMessage("txId invalid")
    .bail(),
];

router.get(
  "/my-transactions/:txId",
  checkAuth,
  transactionDetailsValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { txId } = matchedData(req, {
      locations: ["params"],
    }) as { txId: string };

    const userId = req.user?.id;

    try {
      const transaction = await TransactionModel.findOne({ _id: txId, userId })
        .select("attestationUID txHash createdAt generatedFileId")
        .populate("generatedFileId", "originalPhotoId")
        .lean();
      if (!transaction) {
        return res.status(404).json({ error: "Tranzacția nu există." });
      }

      const existingLink = await getExistingLink(transaction._id);

      return res.status(200).json({
        transaction,
        ...(existingLink != undefined
          ? { downloadLink: existingLink.downloadLink }
          : {}),
      });
    } catch (error) {
      logger.error(
        `${modulePrefix} eroare GET /my-transactions/:txId :`,
        error
      );
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const generateNewLinkValidatorMiddleware = [
  body("txId")
    .exists()
    .withMessage("txId este necesar")
    .bail()
    .isMongoId()
    .withMessage("txId trebuie să fie ID")
    .bail(),
];

router.post(
  "/generate-new-link",
  generateNewLinkValidatorMiddleware,
  checkAuth,
  async (req: any, res: any) => {
    const userId = req.user.id;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { txId } = matchedData(req, {
      locations: ["body"],
    }) as { txId: Types.ObjectId };

    try {
      const user = await UserModel.findById(userId).populate("email").lean();

      if (!user) {
        return res.status(404).json({ error: "Utilizatorul nu există." });
      }

      let link;

      link = await getExistingLink(txId);
      if (!link) {
        link = await generateNewDownloadLink(txId);
      }

      await sendRegeneratedDownloadLink(
        user.email,
        txId.toString(),
        link.downloadLink,
        link.expirationTime,
        link.maxAllowedDownloads
      );
      return res.status(200).json({ message: "Link trimis cu succes." });
    } catch (error) {
      logger.error(`${modulePrefix} eroare POST /generate-new-link :`, error);
      return res.status(500).json({ error: "Eroare server." });
    }
  }
);

export default router;
