import { RequestHandler } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const checkSecureListener:RequestHandler = (req, res, next) => {
  if (req.headers.authorization !== `Bearer ${process.env.INTERNAL_TOKEN_AUTH}`) {
    res.sendStatus(403).json({error: "Acces nepermis."});
    return;
  }
  next();
}

export default checkSecureListener;