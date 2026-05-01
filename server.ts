import express from "express";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import cron from "node-cron";

// ⚠️ IMPORTANT: Vite only in dev
let createViteServer: any;
if (process.env.NODE_ENV !== "production") {
  createViteServer = (await import("vite")).createServer;
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ------------------ MIDDLEWARE ------------------
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Permission denied" });
  }
  next();
};

// ------------------ AUTH ------------------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email exists" });

    const role = (await prisma.user.count()) === 0 ? "Admin" : "Member";

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET
    );

    res.json({ token, user });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid" });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET
    );

    res.json({ token, user });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------ BASIC TEST ------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// ------------------ CRON ------------------
cron.schedule("*/10 * * * *", () => {
  console.log("Cron running...");
});

// ------------------ START SERVER ------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  } else {
    // ✅ FIXED STATIC PATH
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();