/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import logger from "../helpers/logger/loggerConfig";
import PhotoModel, {
  ASPECT_LANDSCAPE,
  ASPECT_PORTRAIT,
  ASPECT_SQUARE,
} from "../models/imageModel";
import UserModel from "../models/userModel";
import CategoryModel from "../models/categoryModel";
import TagModel from "../models/tagModel";
import dotenv from "dotenv";
import { matchedData, param, query, validationResult } from "express-validator";
import { ethers } from "ethers";
import { Types } from "mongoose";
const modulePrefix = "[MainRoutes]";
dotenv.config();

const aspectRatios = [ASPECT_LANDSCAPE, ASPECT_PORTRAIT, ASPECT_SQUARE];

const router = express.Router();

const allPhotosValidatorMiddleware = [
  query("category")
    .optional()
    .isMongoId()
    .withMessage("category trebuie să fie un ID valid"),
  query("tags")
    .optional()
    .customSanitizer((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string" && val.length) return [val];
      return [];
    })
    .isArray({ min: 1 })
    .withMessage("tags trebuie să fie un array cu cel puțin un ID"),
  query("tags.*")
    .isMongoId()
    .withMessage("Fiecare tag trebuie să fie un ID valid"),
  query("matchAllTags")
    .optional()
    .isBoolean({ loose: true })
    .withMessage("matchAllTags trebuie să fie boolean")
    .toBoolean(),
  query("sortByLatest")
    .optional()
    .isBoolean({ loose: true })
    .withMessage("sortByLatest trebuie să fie boolean")
    .toBoolean(),
  query("sortByCheapestFirst")
    .optional()
    .isBoolean({ loose: true })
    .withMessage("sortByCheapestFirst trebuie să fie boolean")
    .toBoolean(),
  query("getHiResPreview")
    .optional()
    .isBoolean({ loose: true })
    .withMessage("getHiResPreview trebuie să fie boolean")
    .toBoolean(),
  query("aspectRatio")
    .optional()
    .isIn(aspectRatios)
    .withMessage(
      `aspectRatio trebuie să fie unul dintre: ${aspectRatios.join(", ")}`
    )
    .toLowerCase(),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page trebuie să fie un număr întreg ≥ 1")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage("limit trebuie să fie un număr întreg ≥ 1 și ≤ 24")
    .toInt(),
];

router.get(
  "/all-photos",
  allPhotosValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      category,
      tags = [],
      matchAllTags = false,
      sortByLatest = true,
      sortByCheapestFirst = false,
      getHiResPreview = false,
      aspectRatio,
      page = 1,
      limit = 16,
    } = matchedData(req, {
      locations: ["query"],
      includeOptionals: true,
    }) as {
      category?: string;
      tags?: string[];
      matchAllTags?: boolean;
      sortByLatest?: boolean;
      sortByCheapestFirst?: boolean;
      getHiResPreview?: boolean;
      aspectRatio?: string;
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (category) {
      filter.category = category;
    }

    if (tags.length) {
      filter.tags = matchAllTags == true ? { $all: tags } : { $in: tags };
    }

    if (aspectRatio) {
      filter.aspectRatioType = aspectRatio;
    }

    filter.isRevoked = false;
    filter.attestationUID = { $exists: true };

    const baseSelectFields = [
      "userId",
      "title",
      "description",
      "category",
      "tags",
      "createdAt",
      "ethPriceStr",
      "attestationUID",
      "previewUrl",
      "blurhashStr",
    ];

    if (getHiResPreview) {
      baseSelectFields.push("highResPreviewUrl");
    }

    try {
      const [photos, total] = await Promise.all([
        PhotoModel.find(filter)
          .select(baseSelectFields.join(" "))
          .populate("userId", "username")
          .populate("category", "title")
          .populate("tags", "title")
          .skip(skip)
          .limit(limit)
          .sort(
            sortByCheapestFirst
              ? { ethPriceWei: 1 }
              : sortByLatest
              ? { createdAt: -1 }
              : {}
          )
          .lean(),
        PhotoModel.countDocuments(filter),
      ]);

      return res.json({
        photodata: photos,
        pagedata: {
          totalResults: total,
          currentPage: page,
          documentLimit: limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare GET /all-photos:`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const photoDetailsValidatorMiddleware = [
  param("identifier")
    .exists()
    .withMessage("identifier este necesar")
    .bail()
    .custom((v) => {
      const isMongoId = Types.ObjectId.isValid(v);
      const isEasUid = ethers.isHexString(v, 32) && v.startsWith("0x");

      if (!isMongoId && !isEasUid) {
        return false;
      }
      return true;
    })
    .withMessage("identifier trebuie să fie mongo ID sau EAS UID")
    .bail(),
];

router.get(
  "/photo-details/:identifier",
  photoDetailsValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier } = matchedData(req, { locations: ["params"] }) as {
      identifier: string;
    };

    try {
      const isMongoId = Types.ObjectId.isValid(identifier);
      const filter: Record<string, any> = {};
      filter.isRevoked = false;
      if (isMongoId) {
        filter._id = identifier;
        filter.attestationUID = { $exists: true };
      } else {
        filter.attestationUID = { $eq: identifier, $exists: true };
      }

      const photoData = await PhotoModel.findOne(filter)
        .select(
          "userId title description category tags createdAt blurhashStr location aspectRatioType ethPriceStr attestationUID previewUrl"
        )
        .populate("userId", "username")
        .populate("category", "title")
        .populate("tags", "title")
        .lean();

      if (!photoData) {
        return res.status(404).json({ error: "Fotografia nu a fost găsită." });
      }

      return res.json(photoData);
    } catch (error: any) {
      logger.error(
        `${modulePrefix} eroare GET /photo-details/${identifier}:`,
        error
      );
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.get("/all-categories", async (req: any, res: any) => {
  try {
    const categoriesRes = await CategoryModel.find({}, "title")
      .sort({ title: 1 })
      .lean();
    return res.json({ categories: categoriesRes });
  } catch (error: any) {
    logger.error(`${modulePrefix} eroare GET /all-categories:`, error);
    return res.status(500).json({ error: "Eroare server" });
  }
});

router.get("/all-tags", async (req: any, res: any) => {
  try {
    const tagsRes = await TagModel.find({}, "title").sort({ title: 1 }).lean();
    return res.json({ tags: tagsRes });
  } catch (error: any) {
    logger.error(`${modulePrefix} eroare GET /all-tags:`, error);
    return res.status(500).json({ error: "Eroare server" });
  }
});

const userProfileValidatorMiddleware = [
  param("username")
    .exists()
    .withMessage("username este necesar")
    .bail()
    .isAlphanumeric()
    .withMessage("doar litere și cifre sunt permise.")
    .trim()
    .escape(),
];

router.get(
  "/user-profile/:username",
  userProfileValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = matchedData(req, { locations: ["params"] }) as {
      username: string;
    };

    try {
      const userData = await UserModel.findOne({
        username: username,
        blockchainConfirmed: true,
        type: "seller",
        role: "user",
      })
        .select("username createdAt attestationUID")
        .lean();

      if (!userData) {
        return res
          .status(404)
          .json({ error: "Profilul utilizatorului nu a fost găsit." });
      }

      const userPhotos = await PhotoModel.find({
        userId: userData._id,
        attestationUID: { $exists: true },
        isRevoked: false,
      })
        .select(
          "title description category tags ethPriceStr previewUrl blurhashStr"
        )
        .populate("category", "title")
        .populate("tags", "title")
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ userData, userPhotos });
    } catch (error) {
      logger.error(
        `${modulePrefix} eroare GET /user-profile/${username}:`,
        error
      );
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

const searchValidatorMiddleware = [
  query("searchterm")
    .exists()
    .withMessage("searchterm este necesar")
    .bail()
    .isAlphanumeric()
    .withMessage("doar litere și cifre sunt permise.")
    .trim()
    .escape(),
  query("limit")
    .optional()
    .isNumeric()
    .withMessage("doar numere sunt permise."),
];

router.get("/search", searchValidatorMiddleware, async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { searchterm, limit = 10 } = matchedData(req, {
    locations: ["query"],
    includeOptionals: true,
  }) as {
    searchterm?: string;
    limit?: number;
  };

  try {
    const results = await PhotoModel.find({
      title: { $regex: searchterm, $options: "i" },
      attestationUID: { $exists: true },
      isRevoked: false,
    })
      .select("_id title")
      .limit(limit);
    res.status(200).json({ results });
  } catch (err: any) {
    logger.error(`${modulePrefix} eroare GET /searchByName:`, err);
    return res.status(500).json({ error: "Eroare server" });
  }
});

export default router;
