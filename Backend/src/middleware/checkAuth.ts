import { RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import cookieParser from "cookie-parser";

export default [
  cookieParser(),
  ((req, res, next) => {
    const token = req.cookies.token as string | undefined;
    if (!token) return res.status(401).json({ error: "Neautentificat." });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      req.user = decoded;
      next();
    } catch {
      res.status(403).json({ error: "Sesiune invalidă." });
    }
  }) as RequestHandler,
];
