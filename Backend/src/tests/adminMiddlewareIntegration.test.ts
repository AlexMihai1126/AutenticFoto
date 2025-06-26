/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Request, Response } from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import adminMiddleware from "../middleware/checkAdmin";
import User, { ADMIN_ROLE } from "../models/userModel";

jest.setTimeout(60_000);

describe("Test integrare Middleware ADMIN", () => {
  let mongod: MongoMemoryServer;
  let app: express.Express;
  const JWT_SECRET = "testsecret";

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    process.env.JWT_SECRET = JWT_SECRET;

    app = express();
    app.use(cookieParser());
    app.use(adminMiddleware as any);
    app.get("/protected", (req: Request, res: Response) => {
      res.json({ ok: true, user: (req as any).user });
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  function makeToken(id: string) {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1h" });
  }

  it("401 pentru cookie inexistent", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Neautentificat." });
  });

  it("403 pentru cookie invalid", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Cookie", [`token=notajwt`]);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Sesiune invalidă." });
  });

  it("403 pentru utilizator negăsit", async () => {
    const fakeId = new mongoose.Types.ObjectId().toHexString();
    const token = makeToken(fakeId);

    const res = await request(app)
      .get("/protected")
      .set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Utilizatorul nu există." });
  });

  it("403 dacă nu este admin", async () => {
    const user = await User.create({ role: "user", username: "testuser", passwordHash: "hashedpassword", email: "email@email.net", confirmationToken:"token" });
    const token = makeToken(user._id.toHexString());

    const res = await request(app)
      .get("/protected")
      .set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Acces nepermis." });
  });

  it("200 OK dacă este ADMIN", async () => {
    const admin = await User.create({ role: ADMIN_ROLE, username: "testuser", passwordHash: "hashedpassword", email: "email@email.net", confirmationToken:"token" });
    const token = makeToken(admin._id.toHexString());

    const res = await request(app)
      .get("/protected")
      .set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
    expect(res.body.user.id).toBe(admin._id.toHexString());
  });
});
