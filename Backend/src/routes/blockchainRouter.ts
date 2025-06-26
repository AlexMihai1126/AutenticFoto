/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import superjson from "superjson";
import * as helpers from "../EAS/easUtils/easHelpers";
import UserModel from "../models/userModel";
import PhotoModel from "../models/imageModel";
import GeneratedFileModel from "../models/generatedFilesModel";
import { body, matchedData, validationResult } from "express-validator";
import { GCSFileService } from "../GCS/gcsFileService";
import { getOriginalsBucket } from "../GCS/gcsConfig";
import {
  delegatedAttestPhotoRegistrationRequest,
  delegatedAttestPhotoBuyRequest,
  delegatedRevokeRequest,
} from "../EAS/easUtils/easDelegated";
import checkAuth from "../middleware/checkAuth";
import { ethers } from "ethers";
import {
  delegatedBuyResultPayload,
  delegatedResultPayload,
  DelegatedRevocationPayload,
} from "../commonInterfaces";
import logger from "../helpers/logger/loggerConfig";
import { FileData, UploadedFileData } from "../GCS/gcsInterfaces";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import { addMetadata } from "meta-png";
import { pinataUploader } from "../IPFS/pinataConfig";
const modulePrefix = "[BlockchainRoutes]";

const router = express.Router();

const photoRegistrationValidatorMiddleware = [
  body("uploadId")
    .exists()
    .withMessage("uploadId este necesar.")
    .bail()
    .isMongoId()
    .withMessage("uploadId invalid.")
    .trim(),
  body("currentWallet")
    .exists()
    .withMessage("currentWallet este necesar.")
    .bail()
    .custom((v: string) => ethers.isAddress(v))
    .withMessage("Adresă wallet invalidă.")
    .customSanitizer((v: string) => v.toLowerCase()),
];

router.post(
  "/photo-registration",
  checkAuth,
  photoRegistrationValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uploadId, currentWallet } = matchedData(req, {
      locations: ["body"],
    }) as {
      uploadId: string;
      currentWallet: string;
    };

    try {
      const userId = req.user?.id;
      const user = await UserModel.findById(userId);
      const photo = await PhotoModel.findById(uploadId);
      if (!user || !photo) {
        return res.status(400).json({ error: "Date invalide." });
      }

      if (user?.walletAddress !== currentWallet) {
        return res.status(400).json({
          error:
            "Adresa wallet asociată contului nu este aceeași cu cea conectată.",
        });
      }

      if (photo.userId.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Nu sunteți proprietarul acestei fotografii." });
      }

      if (photo.attestationUID) {
        return res
          .status(409)
          .json({ error: "Această fotografie a fost deja atestată." });
      }

      const isIpfs: boolean = photo.storageProvider === "ipfs";
      const dbIdHash = ethers.keccak256(ethers.toUtf8Bytes(photo.id));
      const contentHash = `0x${photo.sha256}`;
      const result = await delegatedAttestPhotoRegistrationRequest(
        user.walletAddress,
        dbIdHash,
        contentHash,
        isIpfs,
        photo.ethPriceStr,
        user.attestationUID
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      const resultPayload: delegatedResultPayload = {
        schemaUid: result.schemaUid!,
        recipientWallet: user.walletAddress,
        attesterWallet: result.attesterWallet!,
        encData: result.attestationDataString!,
        refUid: user.attestationUID,
        backendSignatureR: result.backendSignature!.r,
        backendSignatureS: result.backendSignature!.s,
        backendSignatureV: result.backendSignature!.v,
        deadline: result.deadlineTimestampString!,
      };

      return res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .send(superjson.stringify(resultPayload));
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare POST /photo-registration: `, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const photoBuyValidatorMiddleware = [
  body("photoId")
    .exists()
    .withMessage("photoId este necesar.")
    .bail()
    .isMongoId()
    .withMessage("photoId invalid.")
    .trim(),
  body("currentWallet")
    .exists()
    .withMessage("currentWallet este necesar.")
    .bail()
    .custom((v: string) => ethers.isAddress(v))
    .withMessage("Adresă wallet invalidă.")
    .customSanitizer((v: string) => v.toLowerCase()),
  body("ipfsCopy")
    .exists()
    .withMessage("ipfsCopy este necesar.")
    .bail()
    .isBoolean({ loose: true })
    .withMessage("ipfsCopy trebuie să fie boolean")
    .toBoolean(),
];

router.post(
  "/photo-buy",
  checkAuth,
  photoBuyValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { photoId, currentWallet, ipfsCopy } = matchedData(req, {
      locations: ["body"],
    }) as {
      photoId: string;
      currentWallet: string;
      ipfsCopy: boolean;
    };

    try {
      const userId = req.user?.id;
      const user = await UserModel.findById(userId);
      const photo = await PhotoModel.findById(photoId);
      if (!user || !photo) {
        return res.status(400).json({ error: "Date invalide." });
      }

      if (user?.walletAddress !== currentWallet) {
        return res.status(400).json({
          error:
            "Adresa wallet de la înregistrare nu corespunde cu cea curentă.",
        });
      }

      if (photo.isRevoked == true) {
        return res.status(400).json({
          error: "Fotografia nu mai este la vânzare.",
        });
      }

      const isIpfs: boolean = ipfsCopy;

      const photoCopy: FileData =
        await GCSFileService.downloadOriginalAsFileData(photo.fullPath);

      let pngBuffer: Buffer;
      if (photoCopy.mimeType !== "image/png") {
        pngBuffer = await sharp(photoCopy.buffer)
          .resize({
            width: 4032,
            height: 4032,
            fit: "inside",
            withoutEnlargement: true,
          })
          .png({
            compressionLevel: 8,
            adaptiveFiltering: true,
            palette: false,
          })
          .toBuffer();
        photoCopy.mimeType = "image/png";
      } else {
        pngBuffer = photoCopy.buffer;
      }

      const pngInjectedTimestampMetadata: Uint8Array = addMetadata(
        pngBuffer,
        "purchaseTimestamp",
        Date.now().toString()
      );

      const pngInjectedBuyerWalletAddr: Uint8Array = addMetadata(
        pngInjectedTimestampMetadata,
        "buyerWalletAddress",
        user.walletAddress
      );

      const newImageBuffer: Buffer = Buffer.from(pngInjectedBuyerWalletAddr);

      const { name } = path.parse(photo.originalName);
      const newName = `purchased_${name}_${user.username}.png`;
      photoCopy.originalName = newName;
      photoCopy.buffer = newImageBuffer;

      let dbIdHash;
      const newFileSha256 = crypto
        .createHash("sha256")
        .update(photoCopy.buffer)
        .digest("hex");
      if (ipfsCopy == false) {
        const generatedFile: UploadedFileData =
          await GCSFileService.uploadOriginal(photoCopy);
        const origBucketName = getOriginalsBucket().name;
        const newOriginalUrl =
          `https://storage.googleapis.com/${origBucketName}/` +
          encodeURIComponent(generatedFile.fullPath!);

        const newGeneratedFile = await GeneratedFileModel.create({
          originalName: newName,
          originalPhotoId: photo._id,
          mimeType: generatedFile.mimeType,
          sha256: newFileSha256,
          storageProvider: "gcs",
          fullPath: generatedFile.fullPath,
          originalUrl: newOriginalUrl,
        });

        dbIdHash = ethers.keccak256(
          ethers.toUtf8Bytes(newGeneratedFile._id.toString())
        );
      } else {
        try {
          const ipfsFileCopy = new File([photoCopy.buffer.buffer], newName, {
            type: photoCopy.mimeType,
          });
          const upload = await pinataUploader.upload.public.file(ipfsFileCopy);
          const cid = upload.cid;
          dbIdHash = ethers.keccak256(ethers.toUtf8Bytes(cid));
          const ipfsUrl: string = `https://gateway.pinata.cloud/ipfs/${cid}`;
          await GeneratedFileModel.create({
            originalName: newName,
            originalPhotoId: photo._id,
            mimeType: photoCopy.mimeType,
            sha256: newFileSha256,
            storageProvider: "ipfs",
            fullPath: cid,
            originalUrl: ipfsUrl,
          });
        } catch (error: any) {
          logger.error(
            `${modulePrefix} eroare la încărcarea fișierului ${newFileSha256} pe IPFS: `,
            error
          );
          return res.status(400).json({
            error: `Eroare la generarea copiei pe IPFS.`,
          });
        }
      }
      const newFileSha256Hex = `0x${newFileSha256}`;
      const result = await delegatedAttestPhotoBuyRequest(
        user.walletAddress,
        dbIdHash,
        newFileSha256Hex,
        isIpfs,
        photo.ethPriceStr,
        photo.attestationUID!,
        ""
      );

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      const resultPayload: delegatedBuyResultPayload = {
        schemaUid: result.schemaUid!,
        recipientWallet: user.walletAddress,
        attesterWallet: result.attesterWallet!,
        encData: result.attestationDataString!,
        refUid: photo.attestationUID!,
        backendSignatureR: result.backendSignature!.r,
        backendSignatureS: result.backendSignature!.s,
        backendSignatureV: result.backendSignature!.v,
        ethValue: photo.ethPriceStr,
        deadline: result.deadlineTimestampString!,
      };

      return res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .send(superjson.stringify(resultPayload));
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare POST /photoBuy: `, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const photoRevokeValidatorMiddleware = [
  body("revocationUid")
    .exists()
    .withMessage("revocationUid este necesar.")
    .bail()
    .custom((v: string) => ethers.isHexString(v, 32) && v.startsWith("0x"))
    .withMessage("revocationUid invalid.")
    .customSanitizer((v: string) => v.toLowerCase()),
  body("currentWallet")
    .exists()
    .withMessage("currentWallet este necesar.")
    .bail()
    .custom((v: string) => ethers.isAddress(v))
    .withMessage("Adresă wallet invalidă.")
    .customSanitizer((v: string) => v.toLowerCase()),
];

router.post(
  "/photo-revoke",
  checkAuth,
  photoRevokeValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { revocationUid, currentWallet } = matchedData(req, {
      locations: ["body"],
    }) as {
      revocationUid: string;
      currentWallet: string;
    };

    try {
      const userId = req.user?.id;
      const user = await UserModel.findById(userId);
      const photo = await PhotoModel.findOne({ attestationUID: revocationUid });
      if (!user) {
        return res.status(400).json({ error: "Utilizatorul nu există." });
      }

      if (user?.walletAddress !== currentWallet) {
        return res.status(400).json({
          error:
            "Adresa wallet de la înregistrare nu corespunde cu cea curentă.",
        });
      }

      if (!photo) {
        return res.status(400).json({ error: "Fotografia nu există." });
      }
      const result = await delegatedRevokeRequest(
        photo.attestationUID!,
        helpers.getPhotoRegisterSchemaName()
      );

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      const resultPayload: DelegatedRevocationPayload = {
        schemaUid: result.schemaUid!,
        recipientWallet: user.walletAddress,
        attesterWallet: result.revokerWallet!,
        revokeUid: photo.attestationUID!,
        backendSignatureR: result.backendSignature!.r,
        backendSignatureS: result.backendSignature!.s,
        backendSignatureV: result.backendSignature!.v,
        deadline: result.deadlineTimestampString!,
      };

      return res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .send(superjson.stringify(resultPayload));
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare POST /photoRevoke: `, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

export default router;
