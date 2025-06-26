/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import UserModel, { USER_BUYER, USER_SELLER } from "../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendConfirmationEmail } from "../nodemailer/nodemailerSender";
import { body, matchedData, validationResult } from "express-validator";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import logger from "../helpers/logger/loggerConfig";
import checkAuth from "../middleware/checkAuth";
const modulePrefix = "[AuthRoutes]";
dotenv.config();

const router = express.Router();

router.use(cookieParser());

const registerValidatorMiddleware = [
  body("email")
    .exists()
    .withMessage("Email-ul trebuie completat.")
    .bail()
    .isEmail()
    .withMessage("Trebuie să fie un email valid.")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("username")
    .exists()
    .withMessage("Username trebuie completat.")
    .bail()
    .isAlphanumeric()
    .withMessage("Doar litere și cifre sunt permise.")
    .isLength({ min: 4, max: 20 })
    .withMessage("Lungimea trebuie să fie între 4 și 20 de caractere.")
    .trim()
    .escape(),

  body("password")
    .exists()
    .withMessage("Parola trebuie completată.")
    .bail()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Parola trebuie să conțină cel puțin 8 caractere, o majusculă, o literă mică, un număr și un simbol."
    ),

  body("registerAsPhotographer")
    .exists()
    .withMessage("registerAsPhotographer trebuie completat")
    .bail()
    .isBoolean({ loose: true })
    .withMessage("registerAsPhotographer trebuie să fie boolean")
    .bail()
    .toBoolean(),
];

router.post(
  "/register",
  registerValidatorMiddleware,
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password, registerAsPhotographer } = matchedData(
      req,
      { locations: ["body"] }
    ) as {
      email: string;
      username: string;
      password: string;
      registerAsPhotographer: boolean;
    };

    try {
      const userByName = await UserModel.findOne({ username });
      if (userByName) {
        return res.status(400).json({
          error: "Numele de utilizator este deja asociat altui cont.",
        });
      }

      const userByEmail = await UserModel.findOne({ email });
      if (userByEmail) {
        return res
          .status(400)
          .json({ error: "Adresa de email este deja asociată altui cont." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const token = uuidv4();
      const userType = registerAsPhotographer ? USER_SELLER : USER_BUYER;

      const newUser = new UserModel({
        username,
        email,
        passwordHash: hashedPassword,
        type: userType,
        confirmationToken: token,
      });

      await newUser.save();
      await sendConfirmationEmail(email, token);

      res.status(201).json({ message: "Înregistrat." });
    } catch (error: any) {
      logger.error(`${modulePrefix} eroare POST /register:`, error);
      res.status(500).json({ error: "Eroare server" });
    }
  }
);

const loginValidationMiddleware = [
  body("email")
    .exists()
    .withMessage("Email-ul trebuie completat.")
    .bail()
    .isEmail()
    .withMessage("Trebuie să fie un email valid.")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password").exists().withMessage("Parola trebuie completată."),
];

router.post("/login", loginValidationMiddleware, async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = matchedData(req, { locations: ["body"] }) as {
    email: string;
    password: string;
  };

  try {
    const user = await UserModel.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "Email sau parolă invalide." });

    if (!user.confirmed)
      return res.status(403).json({ error: "Contul nu a fost confirmat." });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(400).json({ error: "Email sau parolă invalide." });

    const payload = {
      id: user._id,
      email: user.email,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Autentificat." });
  } catch (error: any) {
    logger.error(`${modulePrefix} eroare la POST /login:`, error);
    return res.status(500).json({ error: "Eroare server." });
  }
});

router.post("/logout", (req: any, res: any) => {
  if (!req.cookies.token) {
    return res.status(200).json({ message: "Nu există cookie de șters." });
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({ message: "Deconectat." });
});

router.get("/check-session", checkAuth, (_req: any, res: any) => {
  return res.status(200).json({ ok: true });
});


export default router;
