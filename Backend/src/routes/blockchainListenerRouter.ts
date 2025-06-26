/* eslint-disable @typescript-eslint/no-explicit-any */
import checkSecureListener from "../middleware/checkSecureListener";
import logger from "../helpers/logger/loggerConfig";
import PhotoModel from "../models/imageModel";
import TransactionModel from "../models/transactionModel";
import UserModel from "../models/userModel";
import {
  sendPhotoRegistrationEmail,
  sendPurchaseConfirmationEmail,
  sendIPFSLinkEmail,
  sendDownloadLinkEmail,
} from "../nodemailer/nodemailerSender";
import express from "express";
import generateNewDownloadLink from "../helpers/generateDownloadLink";
import dotenv from "dotenv";
import GeneratedFileModel from "../models/generatedFilesModel";
const modulePrefix = "[BlockchainSecureRoutes]";
dotenv.config();

const router = express.Router();

router.use(checkSecureListener);

router.post(
  "/validate-photo-registration",
  checkSecureListener,
  async (req: any, res: any) => {
    const { photoAttUid, sha256, photographerWallet } = req.body;
    try {
      const photo = await PhotoModel.findOne({ sha256 }).populate(
        "userId",
        "walletAddress email"
      );
      if (!photo) {
        return res.status(404).json({ error: "Poza nu există." });
      }

      const ownerWallet = (photo.userId as any).walletAddress as string;
      if (
        ownerWallet.toLowerCase() !==
        (photographerWallet as string).toLowerCase()
      ) {
        return res.status(400).json({
          error: "Wallet-ul din atestare nu corespunde proprietarului pozei.",
        });
      }

      photo.attestationUID = photoAttUid;
      await photo.save();
      await sendPhotoRegistrationEmail(
        (photo.userId as any).email as string,
        photo.title,
        photoAttUid
      );
      return res.status(200);
    } catch (error: any) {
      logger.error(
        `${modulePrefix} eroare POST /validate-photo-registration:`,
        error
      );
      res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.post(
  "/photo-revoke-confirm",
  checkSecureListener,
  async (req: any, res: any) => {
    const { photoAttUid, photographerWallet } = req.body;
    try {
      const photo = await PhotoModel.findOne({
        attestationUID: photoAttUid,
      }).populate("userId", "walletAddress");
      if (!photo) {
        return res.status(404).json({ error: "Poza nu există." });
      }

      const ownerWallet = (photo.userId as any).walletAddress as string;
      if (
        ownerWallet.toLowerCase() !==
        (photographerWallet as string).toLowerCase()
      ) {
        return res.status(400).json({
          error: "Wallet-ul din atestare nu corespunde proprietarului pozei.",
        });
      }

      photo.isRevoked = true;
      await photo.save();
      return res.status(200);
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare POST /photo-revoke-confirm:`, error);
      res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.post(
  "/validate-purchase",
  checkSecureListener,
  async (req: any, res: any) => {
    const {
      purchaseAttUID,
      wAddress,
      sha256,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      resourceIdHash,
      isIpfs,
      gasPaid,
      txHash,
      blockHash,
      blockNo,
    } = req.body;

    try {
      const user = await UserModel.findOne({ walletAddress: wAddress });
      if (!user) {
        return res.status(404).json({ error: "Utilizator negăsit." });
      }

      const generatedPhoto = await GeneratedFileModel.findOne({ sha256 });

      if (!generatedPhoto) {
        return res.status(404).json({ error: "Fișier generat negăsit." });
      }

      const purchasedPhoto = await PhotoModel.findById(
        generatedPhoto.originalPhotoId
      );
      if (!purchasedPhoto) {
        return res
          .status(404)
          .json({ error: "Fotografie originală negăsită." });
      }

      const transaction = await TransactionModel.create({
        userId: user?._id,
        generatedFileId: generatedPhoto._id,
        attestationUID: purchaseAttUID,
        txHash,
        blockHash,
        blockNumber: blockNo,
        gasPaid,
      });

      await sendPurchaseConfirmationEmail(
        user.email,
        purchasedPhoto.title,
        purchaseAttUID,
        transaction._id.toString()
      );

      if (isIpfs) {
        const { downloadLink } = await generateNewDownloadLink(transaction._id);
        await sendIPFSLinkEmail(user.email, purchasedPhoto.title, downloadLink);
      } else {
        const { downloadLink, expirationTime, maxAllowedDownloads } =
          await generateNewDownloadLink(transaction._id, {
            validForHours: 48,
            maxDownloads: 1,
          });
        await sendDownloadLinkEmail(
          user.email,
          purchasedPhoto.title,
          downloadLink,
          maxAllowedDownloads!,
          expirationTime!
        );
      }
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare POST /validate-purchase:`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

export default router;
