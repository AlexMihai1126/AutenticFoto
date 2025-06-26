/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import TagModel from "../models/tagModel";
import CategoryModel from "../models/categoryModel";
import checkAdmin from "../middleware/checkAdmin";
import { body, matchedData, param, validationResult } from "express-validator";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import logger from "../helpers/logger/loggerConfig";
const modulePrefix = "[AdminRoutes]";
dotenv.config();

const router = express.Router();

router.use(cookieParser());
router.use(checkAdmin);

router.get("/categories", checkAdmin, async (req: any, res: any) => {
  try {
    const categoriesRes = await CategoryModel.find(
      {},
      "title slug description order"
    )
      .sort({ title: 1 })
      .lean();
    return res.json({ categories: categoriesRes });
  } catch (error: any) {
    logger.error(`${modulePrefix} eroare GET /categories:`, error);
    return res.status(500).json({ error: "Eroare server" });
  }
});

router.get("/tags", checkAdmin, async (req: any, res: any) => {
  try {
    const tagsRes = await TagModel.find({}, "title slug description")
      .sort({ title: 1 })
      .lean();
    return res.json({ tags: tagsRes });
  } catch (error: any) {
    logger.error(`${modulePrefix} eroare GET /tags:`, error);
    return res.status(500).json({ error: "Eroare server" });
  }
});

const categoryOrTagValidatorMiddleware = [
  body("slug")
    .optional()
    .isString()
    .withMessage("url-slug trebuie să fie text")
    .trim()
    .toLowerCase(),

  body("title")
    .optional()
    .isLength({ min: 1, max: 80 })
    .isString()
    .withMessage("titlul trebuie să fie text")
    .trim(),

  body("description")
    .optional()
    .isString()
    .withMessage("descrierea trebuie să fie text")
    .trim(),

  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("ordinea >= 0")
    .toInt(),
];

const idValidatorMiddleware = [
  param("id")
    .exists()
    .withMessage("id is este necesar")
    .bail()
    .isMongoId()
    .withMessage("id invalid"),
];

router.post(
  "/categories",
  categoryOrTagValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug, title, description, order } = matchedData(req, {
      locations: ["body"],
    }) as {
      slug: string;
      title: string;
      description: string;
      order: number;
    };

    try {
      const newCateg = await CategoryModel.create({
        slug,
        title,
        description,
        order,
      });
      return res.status(201).json(newCateg);
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare POST /categories:`, error);
      if (error.code === 11000) {
        return res.status(400).json({ error: "Acest URL-slug pentru categorie există deja." });
      }
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.put(
  "/categories/:id",
  idValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = matchedData(req, {
      locations: ["params"],
    }) as { id: string };

    try {
      const updated = await CategoryModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!updated) {
        return res.status(404).json({ error: "Categoria nu există." });
      }
      return res.status(200).json(updated);
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare PUT /categories/${id}:`, error);
      if (error.code === 11000) {
        return res.status(400).json({ error: "Acest URL-slug pentru categorie există deja." });
      }
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.delete(
  "/categories/:id",
  idValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = matchedData(req, {
      locations: ["params"],
    }) as { id: string };

    try {
      const deleted = await CategoryModel.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Categoria nu există." });
      }
      return res.status(200).json({ message: "Categoria a fost ștearsă cu succes." });
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare DELETE /categories/${id}:`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.post(
  "/tags",
  categoryOrTagValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug, title, description } = matchedData(req, {
      locations: ["body"],
    }) as {
      slug: string;
      title: string;
      description: string;
    };

    try {
      const newTag = await TagModel.create({ slug, title, description });
      return res.status(201).json(newTag);
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare POST /tags:`, error);
      if (error.code === 11000) {
        return res.status(400).json({ error: "Acest URL-slug pentru tag există deja." });
      }
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

router.put("/tags/:id", idValidatorMiddleware, async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = matchedData(req, {
    locations: ["params"],
  }) as { id: string };

  try {
    const updated = await TagModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Tag-ul nu există." });
    }
    return res.status(200).json(updated);
  } catch (error: any) {
    logger.error(`${modulePrefix} eroare PUT /tags/${id}:`, error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Acest URL-slug pentru tag există deja." });
    }
    return res.status(500).json({ error: "Eroare server" });
  }
});

router.delete(
  "/tags/:id",
  idValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = matchedData(req, {
      locations: ["params"],
    }) as { id: string };

    try {
      const deleted = await TagModel.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tag-ul nu există." });
      }
      return res.status(200).json({ message: "Tag șters cu succes." });
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare DELETE /tags/${id}:`, error);
      return res.status(500).json({ error: "Eroare server" });
    }
  }
);

export default router;
