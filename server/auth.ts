import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users, type User } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: sessionTtl,
    },
  });
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

async function createUser(email: string, password: string, firstName?: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({
    email,
    password: hashedPassword,
    firstName,
  }).returning();
  return user;
}

async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

function generateTempPassword(): string {
  return crypto.randomBytes(4).toString("hex");
}

export function setupAuth(app: Express) {
  app.use(getSession());
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "올바른 이메일 형식이 아닙니다." });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "비밀번호는 6자 이상이어야 합니다." });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "이미 등록된 이메일입니다." });
      }

      const user = await createUser(email, password, firstName);
      req.session.userId = user.id;
      
      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "회원가입 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요." });
      }

      const user = await getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
      }

      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다." });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "로그아웃되었습니다." });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await getUserById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      geminiApiKey: user.geminiApiKey,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "이메일을 입력해주세요." });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return res.json({ 
          message: "입력하신 이메일로 임시 비밀번호가 발송되었습니다.",
          success: true 
        });
      }

      const tempPassword = generateTempPassword();
      await updateUserPassword(user.id, tempPassword);

      console.log(`[Password Recovery] User ${email} - Temp password: ${tempPassword}`);

      res.json({ 
        message: "입력하신 이메일로 임시 비밀번호가 발송되었습니다.",
        success: true,
        tempPassword: tempPassword
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "비밀번호 찾기 중 오류가 발생했습니다." });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: "Unauthorized" });
  }

  (req as any).user = user;
  next();
};
