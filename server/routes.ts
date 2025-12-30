import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { isAuthenticated } from "./replit_integrations/auth";
import { GoogleGenAI } from "@google/genai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth (Must be first)
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Setup AI (Chat & Image)
  registerChatRoutes(app);
  registerImageRoutes(app);

  // 3. App Routes

  // --- Journals ---
  app.get(api.journals.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const journals = await storage.getJournals(userId);
    res.json(journals);
  });

  app.post(api.journals.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const input = api.journals.create.input.parse({ ...req.body, userId }); // Force userId
    const journal = await storage.createJournal(input);
    res.status(201).json(journal);
  });

  app.put(api.journals.update.path, isAuthenticated, async (req, res) => {
    const input = api.journals.update.input.parse(req.body);
    const updated = await storage.updateJournal(Number(req.params.id), input);
    res.json(updated);
  });

  app.delete(api.journals.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteJournal(Number(req.params.id));
    res.status(204).send();
  });

  // --- Tokens ---
  app.get(api.tokens.list.path, async (req, res) => {
    const tokens = await storage.getTokens();
    res.json(tokens);
  });

  app.post(api.tokens.create.path, isAuthenticated, async (req: any, res) => {
    const fromUserId = req.user.claims.sub;
    const input = api.tokens.create.input.parse({ ...req.body, fromUserId });
    const token = await storage.createToken(input);
    res.status(201).json(token);
  });

  app.post(api.tokens.accept.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const tokens = await storage.getTokens();
    const targetToken = tokens.find(t => t.id === Number(req.params.id));
    
    if (!targetToken) {
      return res.status(404).json({ message: "Token not found" });
    }
    
    const userName = user.firstName || user.email || "";
    if (targetToken.receiverName !== userName && targetToken.toUserId !== userId) {
      return res.status(403).json({ message: "You can only accept tokens sent to you" });
    }
    
    const token = await storage.acceptToken(Number(req.params.id));
    res.json(token);
  });

  // --- Leads ---
  app.get(api.leads.list.path, async (req, res) => {
    const leads = await storage.getLeads();
    res.json(leads);
  });

  app.post(api.leads.create.path, async (req, res) => {
    const input = api.leads.create.input.parse(req.body);
    const lead = await storage.createLead(input);
    res.status(201).json(lead);
  });

  app.put(api.leads.update.path, async (req, res) => {
    const input = api.leads.update.input.parse(req.body);
    const lead = await storage.updateLead(Number(req.params.id), input);
    res.json(lead);
  });

  // --- Folders ---
  app.get(api.folders.list.path, async (req, res) => {
    const folders = await storage.getFolders();
    res.json(folders);
  });

  app.post(api.folders.create.path, async (req, res) => {
    const input = api.folders.create.input.parse(req.body);
    const folder = await storage.createFolder(input);
    res.status(201).json(folder);
  });

  app.delete(api.folders.delete.path, async (req, res) => {
    await storage.deleteFolder(Number(req.params.id));
    res.status(204).send();
  });

  // --- Users (for token game) ---
  app.get(api.users.list.path, isAuthenticated, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // --- Batch Members ---
  app.get(api.batchMembers.listAll.path, async (req, res) => {
    const members = await storage.getAllBatchMembers();
    res.json(members);
  });

  app.get(api.batchMembers.list.path, async (req, res) => {
    const members = await storage.getBatchMembers(Number(req.params.folderId));
    res.json(members);
  });

  app.post(api.batchMembers.create.path, async (req, res) => {
    const input = api.batchMembers.create.input.parse({
      ...req.body,
      folderId: Number(req.params.folderId)
    });
    const member = await storage.createBatchMember(input);
    res.status(201).json(member);
  });

  app.delete(api.batchMembers.delete.path, async (req, res) => {
    await storage.deleteBatchMember(Number(req.params.id));
    res.status(204).send();
  });

  // --- Member Journals ---
  app.get(api.memberJournals.list.path, async (req, res) => {
    const journals = await storage.getJournalsByMember(Number(req.params.memberId));
    res.json(journals);
  });

  // --- Settings ---
  app.get(api.settings.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const apiKey = await storage.getUserGeminiApiKey(userId);
    res.json({ hasGeminiApiKey: !!apiKey });
  });

  app.put(api.settings.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { geminiApiKey } = req.body;
    await storage.updateUserSettings(userId, { geminiApiKey });
    res.json({ success: true });
  });

  // --- Crack Time with User's API Key ---
  app.post("/api/crack-time", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const apiKey = await storage.getUserGeminiApiKey(userId);
      
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 먼저 입력해주세요." });
      }

      const { content, userName } = req.body;
      if (!content) {
        return res.status(400).json({ error: "고민 내용을 입력해주세요." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `당신은 AGround의 성장 컨설턴트입니다. 크랙 타임은 사용자의 막연한 고민을 명확한 관점과 구체적인 실행 계획으로 바꿔주는 프로그램입니다.

당신의 역할:
- 고민의 핵심을 꿰뚫는 날카로운 관점을 제시합니다
- 사용자가 오늘 당장 실행할 수 있는 구체적인 액션 아이템을 제시합니다
- 따뜻하지만 명확하게, 코치처럼 조언합니다

응답은 반드시 아래의 JSON 형식으로만 작성하세요:
{
  "insight": "고민의 핵심을 꿰뚫는 관점. 첫 문장은 강렬한 헤드라인으로, 나머지 1-2문장은 구체적 설명.",
  "map": ["오늘 할 수 있는 구체적 액션 1", "오늘 할 수 있는 구체적 액션 2", "오늘 할 수 있는 구체적 액션 3"]
}`;

      const userMessage = `${userName || '사용자'} 대표님의 현재의 안개(고민 상황): "${content}"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userMessage }] }
        ],
      });

      const text = response.text || "";
      
      // Parse JSON from response
      let result;
      try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(cleanText);
      } catch (e) {
        result = {
          insight: text,
          map: ["다시 시도해주세요."]
        };
      }

      res.json(result);
    } catch (error: any) {
      console.error("Crack Time error:", error);
      if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API key")) {
        return res.status(401).json({ error: "API 키가 유효하지 않습니다. 설정에서 올바른 키를 입력해주세요." });
      }
      res.status(500).json({ error: "AI 분석 중 오류가 발생했습니다." });
    }
  });

  // --- Seed Data (Check if empty and seed) ---
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingLeads = await storage.getLeads();
  if (existingLeads.length === 0) {
    await storage.createLead({ name: "김철수", status: "new", value: 1000 });
    await storage.createLead({ name: "이영희", status: "consulting", value: 2500 });
    await storage.createLead({ name: "박지성", status: "closing", value: 5000 });
    await storage.createLead({ name: "최동원", status: "registered", value: 10000 });
  }

  const existingFolders = await storage.getFolders();
  if (existingFolders.length === 0) {
    await storage.createFolder({ name: "AG 42기", type: "batch" });
    await storage.createFolder({ name: "AG 43기", type: "batch" });
  }
}
