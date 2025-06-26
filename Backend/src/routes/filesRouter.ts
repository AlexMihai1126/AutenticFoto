/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import multer from "multer";
import sanitizeFilename from "sanitize-filename";
import { matchedData, body, validationResult, param } from "express-validator";
import { GCSFileService } from "../GCS/gcsFileService";
import {
  getHiResPreviewsBucket,
  getOriginalsBucket,
  getPreviewsBucket,
} from "../GCS/gcsConfig";
import { AspectRatioTypes, ImageMetadataModel } from "../models/imageModel";
import checkAuth from "../middleware/checkAuth";
import logger from "../helpers/logger/loggerConfig";
import CategoryModel from "../models/categoryModel";
import TagModel from "../models/tagModel";
import UserModel, { USER_SELLER } from "../models/userModel";
import GeneratedFileModel from "../models/generatedFilesModel";
import DownloadLinkModel, { IPFS_LINK } from "../models/downloadLinksModel";
import { StreamFileData } from "../GCS/gcsInterfaces";
import { ethers } from "ethers";
import crypto from "crypto";
import generateBlurhash from "../helpers/generateBlurhashStr";
const modulePrefix = "[FileRoutes]";

const router = express.Router();
const allowedMimeTypes = ["image/jpeg", "image/png"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, false);
    }
    cb(null, true);
  },
});

const uploadMetadataValidatorMetadata = [
  body("title")
    .exists()
    .withMessage("Titlul este necesar.")
    .bail()
    .isString()
    .isLength({ min: 1, max: 80 })
    .withMessage("Titlul trebuie să fie text.")
    .trim()
    .escape(),

  body("description")
    .optional()
    .isString()
    .withMessage("Descrierea trebuie să fie text.")
    .isLength({ max: 500 })
    .withMessage("Lungimea maximă a descrierii este de 500 de caractere.")
    .trim()
    .escape(),

  body("category")
    .exists()
    .withMessage("Categoria este necesară.")
    .bail()
    .isMongoId()
    .withMessage("ID categorie invalid."),

  body("tags")
    .optional()
    .customSanitizer((v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string" && v.length) return [v];
      return [];
    })
    .isArray()
    .withMessage("tags trebuie să fie un array.")
    .bail(),
  body("tags.*")
    .isMongoId()
    .withMessage("Fiecare tag trebuie să fie un ID valid."),
  body("location")
    .optional()
    .isString()
    .withMessage("location trebuie să fie text")
    .isLength({ max: 128 })
    .withMessage("Lungime maximă de 128 caractere.")
    .trim()
    .escape(),
  body("ethPriceStr")
    .exists()
    .isString()
    .withMessage("Prețul în ETH este necesar.")
    .bail()
    .matches(/^\d+(\.\d+)?$/)
    .withMessage("Preț invalid.")
    .custom(
      (v: string) =>
        ethers.parseEther(v).valueOf() >= ethers.parseEther("0.00001").valueOf()
    )
    .withMessage("Valoarea minimă este 0.00001 ETH.")
    .bail(),
];

router.post(
  "/upload",
  checkAuth,
  upload.single("file"),
  uploadMetadataValidatorMetadata,
  async (req: any, res: any) => {
    const file : Express.Multer.File = req.file;
    if (!file) {
      return res.status(400).json({
        error:
          "Fișier lipsă sau tip nepermis. Se acceptă doar JPG, JPEG sau PNG.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      category,
      tags = [],
      location,
      ethPriceStr,
    } = matchedData(req, { locations: ["body"], includeOptionals: true }) as {
      title: string;
      description?: string;
      category: string;
      tags: string[];
      location?: string;
      ethPriceStr: string;
    };

    try {
      const sha256 = crypto
        .createHash("sha256")
        .update(file.buffer)
        .digest("hex");

      const existingFile = await ImageMetadataModel.findOne({sha256}).select("sha256").lean()
      if(existingFile){
        return res.status(400).json({error: "Fișierul există deja."})
      }

      const categoryExists = await CategoryModel.exists({ _id: category });
      if (!categoryExists) {
        return res.status(400).json({ error: "Categoria nu există." });
      }

      if (tags.length) {
        const foundTags = await TagModel.find(
          { _id: { $in: tags } },
          { _id: 1 }
        ).lean();
        if (foundTags.length !== tags.length) {
          return res
            .status(400)
            .json({ error: "Unul sau mai multe tag-uri nu există." });
        }
      }
      const userId = req.user.id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "Utilizatorul nu există." });
      }

      if (user.type !== USER_SELLER) {
        return res
          .status(403)
          .json({ error: "Nu aveți voie să încărcați fotografii!" });
      }

      const sanitizedName = sanitizeFilename(file.originalname);
      const photoBlurhash = await generateBlurhash(file.buffer);
      const result = await GCSFileService.uploadWithPreview({
        buffer: file.buffer,
        originalName: sanitizedName,
        mimeType: file.mimetype,
      });

      const origBucketName = getOriginalsBucket().name;
      const prevBucketName = getPreviewsBucket().name;
      const hiResPrevBucketName = getHiResPreviewsBucket().name;

      const originalUrl =
        `https://storage.googleapis.com/${origBucketName}/` +
        encodeURIComponent(result.fullPath!);
      const previewUrl =
        `https://storage.googleapis.com/${prevBucketName}/` +
        encodeURIComponent(result.previewPath!);
      const highResPreviewUrl =
        `https://storage.googleapis.com/${hiResPrevBucketName}/` +
        encodeURIComponent(result.hiResPreviewPath!);

      let aspectRatioType: AspectRatioTypes = "unknown";
      if (result.origWidth && result.origHeight) {
        if (result.origWidth > result.origHeight) {
          aspectRatioType = "landscape";
        } else if (result.origHeight > result.origWidth) {
          aspectRatioType = "portrait";
        } else if (result.origWidth == result.origHeight) {
          aspectRatioType = "square";
        }
      }

      await ImageMetadataModel.create({
        userId: user._id,
        originalName: result.originalName,
        title,
        description,
        category,
        tags,
        ethPriceStr,
        mimeType: result.mimeType,
        sha256,
        storageProvider: result.storageProvider,
        fullPath: result.fullPath,
        previewPath: result.previewPath,
        highResPreviewPath: result.hiResPreviewPath,
        originalWidth: result.origWidth,
        originalHeight: result.origHeight,
        location,
        aspectRatioType,
        previewUrl,
        originalUrl,
        highResPreviewUrl,
        blurhashStr: photoBlurhash,
      });

      return res.status(201).json({
        message: "Fișier încărcat cu succes.",
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "O fotografie identică cu aceasta există deja." });
      }
      logger.error(`${modulePrefix} eroare POST /upload:`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const downloadLinkValidatorMiddleware = [
  param("downloadToken")
    .exists()
    .withMessage("downloadToken este necesar")
    .bail()
    .isUUID()
    .withMessage("downloadToken trbuie să fie UUID")
    .bail(),
];

router.get(
  "/download-stream/:downloadToken",
  checkAuth,
  downloadLinkValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { downloadToken } = matchedData(req, { locations: ["params"] }) as {
      downloadToken: string;
    };

    const userId = req.user.id;

    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "Utilizatorul nu există" });
      }

      const downloadLink = await DownloadLinkModel.findOne({ downloadToken });

      if (!downloadLink) {
        return res
          .status(404)
          .json({ error: "Token-ul nu există sau a expirat." });
      }
      if (downloadLink?.userId.toString() !== user?._id.toString()) {
        return res
          .status(403)
          .json({ error: "Link-ul nu aparține contului conectat." });
      }

      if (downloadLink?.linkType == IPFS_LINK) {
        downloadLink.downloadCount += 1;
        await downloadLink.save();
        return res.status(200).json({ ipfsLink: downloadLink?.linkUrl });
      }

      if (downloadLink!.downloadCount >= downloadLink!.maxDownloads!) {
        return res.status(400).json({
          error:
            "Ați descărcat fișierul de mai multe ori decât permite acest link!",
        });
      }

      const generatedFile = await GeneratedFileModel.findOne({
        _id: downloadLink?.generatedFileId,
      });
      if (!generatedFile) {
        return res.status(404).json({ error: "Fișierul nu există." });
      }

      const gcsFilename = generatedFile?.fullPath;

      try {
        const gcsFileStream: StreamFileData =
          await GCSFileService.downloadOriginalAsStream(gcsFilename);

        res.setHeader("Content-Type", gcsFileStream.mimeType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(
            generatedFile.originalName
          )}"`
        );

        gcsFileStream.stream.on("error", (streamErr) => {
          logger.error(
            `${modulePrefix} Eroare stream fișier pentru token download "${downloadToken}":`,
            streamErr
          );
          if (!res.headersSent) {
            res.status(500).json({ error: "Eroare stream fișier." });
          } else {
            res.end();
          }
        });

        downloadLink!.downloadCount += 1;
        await downloadLink?.save();

        gcsFileStream.stream.pipe(res);
      } catch (error: any) {
        logger.error(
          `${modulePrefix} Eroare GCS GET /download-stream pentru token ${downloadToken}:`,
          error
        );
        return res.status(500).json({ error: "Eroare server." });
      }
    } catch (error: any) {
      logger.error(
        `${modulePrefix} Eroare GET /download-stream pentru token ${downloadToken}:`,
        error
      );
      return res.status(500).json({ error: "Eroare server." });
    }
  }
);

export default router;
