import { RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import cookieParser from "cookie-parser";
import User, { ADMIN_ROLE } from "../models/userModel";

export default [
  cookieParser(),
  (async (req, res, next) => {
    const token = req.cookies.token as string | undefined;
    if (!token) return res.status(401).json({ error: "Neautentificat." });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      const userId = decoded.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(403).json({ error: "Utilizatorul nu există." });
      }
      const isAdmin = user.role === ADMIN_ROLE;
      if (!isAdmin) {
        return res.status(403).json({ error: "Acces nepermis." });
      }
      req.user = decoded;
      next();
    } catch {
      res.status(403).json({ error: "Sesiune invalidă." });
    }
  }) as RequestHandler,
];
