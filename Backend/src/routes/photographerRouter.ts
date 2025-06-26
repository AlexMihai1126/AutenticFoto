/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import checkAuth from "../middleware/checkAuth";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import PhotoModel from "../models/imageModel";
import TagModel from "../models/tagModel";
import CategoryModel from "../models/categoryModel";
import {
  body,
  validationResult,
  matchedData,
  param,
  query,
} from "express-validator";
import logger from "../helpers/logger/loggerConfig";
const modulePrefix = "[UserRoutes]";
dotenv.config();

const photosFilterStatus = ["attested", "notAttested", "revoked"] as const;
type PhotoFilters = (typeof photosFilterStatus)[number];

const PHOTO_ATTESTED: PhotoFilters = "attested";
const PHOTO_NOT_ATTESTED: PhotoFilters = "notAttested";
const PHOTO_REVOKED: PhotoFilters = "revoked";

const router = express.Router();

router.use(cookieParser());

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
  query("status")
    .optional()
    .isIn(photosFilterStatus)
    .withMessage(
      `„status” trebuie să fie unul dintre: ${photosFilterStatus.join(", ")}`
    )
    .toLowerCase(),
];

router.get(
  "/my-photos",
  checkAuth,
  myDataValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 16,
      status,
    } = matchedData(req, {
      locations: ["query"],
      includeOptionals: true,
    }) as { page?: number; limit?: number; status?: string };

    const userId = req.user.id;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    filter.userId = userId;
    if (status) {
      if (status === PHOTO_ATTESTED) {
        filter.attestationUID = { $exists: true, $ne: null };
        filter.isRevoked = false;
      }

      if (status === PHOTO_NOT_ATTESTED.toLowerCase()) {
        filter.attestationUID = { $exists: false };
        filter.isRevoked = false;
      }

      if (status === PHOTO_REVOKED) {
        filter.isRevoked = true;
      }
    }

    try {
      const [userPhotos, total] = await Promise.all([
        PhotoModel.find(filter)
          .select(
            "originalName title description category tags createdAt blurhashStr location ethPriceStr attestationUID previewUrl isRevoked"
          )
          .populate("category", "title")
          .populate("tags", "title")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PhotoModel.countDocuments(filter),
      ]);
      return res.status(200).json({
        photodata: userPhotos,
        pagedata: {
          totalResults: total,
          currentPage: page,
          documentLimit: limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error(`${modulePrefix} eroare GET /my-photos :`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const getPhotoDetailsValidatorMiddleware = [
  param("id")
    .exists()
    .withMessage("id este necesar")
    .bail()
    .isMongoId()
    .withMessage("ID invalid"),
];

router.get(
  "/photo/:id",
  checkAuth,
  getPhotoDetailsValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = matchedData(req, {
      locations: ["params"],
    }) as { id: string };

    const userId = req.user?.id;

    try {
      const photo = await PhotoModel.findOne({ _id: id, userId })
        .select("title description originalName location aspectRatioType ethPriceStr category tags isRevoked attestationUID previewUrl highResPreviewUrl blurhashStr createdAt updatedAt")
        .populate("category", "title")
        .populate("tags", "title")
        .lean();

      if (!photo) {
        return res.status(404).json({ error: "Fotografia nu a fost găsită." });
      }

      return res.status(200).json(photo);
    } catch (error) {
      logger.error(`${modulePrefix} GET /photo/:id :`, error);
      return res.status(500).json({ error: "Eroare server." });
    }
  }
);

const updatePhotoValidatorMiddleware = [
  param("id")
    .exists()
    .withMessage("id este necesar")
    .bail()
    .isMongoId()
    .withMessage("id invalid"),
  body("title")
    .optional()
    .isString()
    .isLength({ min: 1, max: 80 })
    .trim()
    .escape(),
  body("description")
    .optional()
    .isString()
    .withMessage("Descrierea trebuie să fie text.")
    .trim()
    .escape(),
  body("category").optional(),
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
  body("ethPriceStr")
    .optional()
    .isString()
    .matches(/^\d+(\.\d+)?$/)
    .withMessage("preț invalid."),
];

router.put(
  "/photo/:id",
  checkAuth,
  updatePhotoValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = matchedData(req, {
      locations: ["params"],
    }) as { id: string };

    const userId = req.user?.id;

    const { title, description, category, tags, ethPriceStr } = matchedData(
      req,
      {
        locations: ["body"],
        includeOptionals: true,
      }
    ) as {
      title: string;
      description: string;
      category: string;
      tags: string[];
      ethPriceStr: string;
    };

    try {
      const photo = await PhotoModel.findOne({ _id: id, userId });

      if (!photo) {
        return res.status(404).json({ error: "Fotografia nu a fost găsită." });
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
        photo.tags = foundTags;
      }

      if (title) photo.title = title;
      if (description) photo.description = description;
      if (!photo.attestationUID && ethPriceStr) photo.ethPriceStr = ethPriceStr;

      if (
        photo.attestationUID &&
        ethPriceStr &&
        ethPriceStr !== photo.ethPriceStr
      ) {
        return res
          .status(400)
          .json({ error: "Prețul nu mai poate fi modificat după atestare." });
      }

      await photo.save();
      return res
        .status(200)
        .json({ message: "Fotografia a fost actualizată." });
    } catch (error) {
      logger.error(`${modulePrefix} eroare PUT /photo/:id :`, error);
      return res.status(500).json({ error: "Eroare server." });
    }
  }
);

router.delete(
  "/photo/:id",
  checkAuth,
  getPhotoDetailsValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = matchedData(req, {
      locations: ["params"],
    }) as { id: string };

    const userId = req.user?.id;

    try {
      const photo = await PhotoModel.findOne({ _id: id, userId });

      if (!photo) {
        return res.status(404).json({ error: "Fotografia nu a fost găsită." });
      }

      if (photo.attestationUID) {
        return res.status(400).json({
          error:
            "Fotografia nu poate fi ștearsă odată atestată, ci doar revocată (scoasă de la vânzare).",
        });
      }

      await photo.deleteOne();

      return res.status(200).json({ message: "Fotografia a fost ștearsă." });
    } catch (error) {
      logger.error(`${modulePrefix} eroare DELETE /photo/:id :`, error);
      return res.status(500).json({ error: "Eroare server." });
    }
  }
);

export default router;
