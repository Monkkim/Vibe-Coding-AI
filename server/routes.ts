import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { GoogleGenAI } from "@google/genai";

function generateCrackTimeHtml(name: string, date: string, situation: string, crackPoint: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRACK TIME - ${date}</title>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 30%, #FFECD2 70%, #FCB69F 100%);
            font-family: 'Noto Sans KR', sans-serif;
            color: #2D2D2D;
        }
        .page {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 20px;
            position: relative;
            overflow: hidden;
        }
        .page::before {
            content: '';
            position: absolute;
            top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: 
                radial-gradient(circle at 30% 20%, rgba(255, 200, 87, 0.4) 0%, transparent 30%),
                radial-gradient(circle at 70% 30%, rgba(255, 165, 0, 0.3) 0%, transparent 25%);
            animation: sunPulse 6s ease-in-out infinite;
        }
        @keyframes sunPulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .page::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                linear-gradient(47deg, transparent 49%, rgba(255, 140, 0, 0.12) 49%, rgba(255, 140, 0, 0.12) 51%, transparent 51%),
                linear-gradient(137deg, transparent 49%, rgba(255, 100, 50, 0.08) 49%, rgba(255, 100, 50, 0.08) 51%, transparent 51%);
            background-size: 120px 120px, 180px 180px;
        }
        .card {
            max-width: 600px; width: 95%;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 24px;
            padding: 48px 36px;
            position: relative;
            border: 2px solid rgba(255, 140, 0, 0.3);
            box-shadow: 0 20px 60px rgba(255, 140, 0, 0.15);
            z-index: 1;
        }
        .crack-line {
            position: absolute;
            background: linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.7), transparent);
            height: 2px;
            animation: crackGlow 2s ease-in-out infinite;
        }
        .crack-line:nth-child(1) { top: 20%; left: -10%; width: 40%; transform: rotate(-15deg); }
        .crack-line:nth-child(2) { top: 60%; right: -5%; width: 30%; transform: rotate(25deg); animation-delay: 0.5s; }
        .crack-line:nth-child(3) { bottom: 30%; left: 10%; width: 25%; transform: rotate(-8deg); animation-delay: 1s; }
        @keyframes crackGlow {
            0%, 100% { opacity: 0.4; box-shadow: 0 0 15px rgba(255, 140, 0, 0.4); }
            50% { opacity: 1; box-shadow: 0 0 25px rgba(255, 140, 0, 0.7); }
        }
        .header { text-align: center; margin-bottom: 40px; }
        .head-icon { width: 80px; height: 80px; margin: 0 auto 20px; }
        .head-icon svg { width: 100%; height: 100%; }
        .logo {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 3.5rem;
            letter-spacing: 12px;
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C00 50%, #FFB347 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }
        .date { font-size: 0.85rem; color: #FF8C00; letter-spacing: 3px; font-weight: 500; }
        .name {
            font-size: 2.2rem; font-weight: 700; text-align: center;
            margin-bottom: 32px; position: relative; width: 100%; color: #333;
        }
        .name::after {
            content: ''; position: absolute; bottom: -8px; left: 50%;
            transform: translateX(-50%); width: 60px; height: 3px;
            background: linear-gradient(90deg, transparent, #FF8C00, transparent);
        }
        .section { margin-bottom: 28px; }
        .section-title { font-size: 0.75rem; color: #FF6B35; letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase; font-weight: 700; }
        .content { font-size: 1rem; line-height: 1.8; color: #444; }
        .insight {
            background: linear-gradient(135deg, rgba(255, 140, 0, 0.15) 0%, rgba(255, 200, 100, 0.1) 100%);
            border-left: 4px solid #FF8C00;
            padding: 20px 24px;
            border-radius: 0 16px 16px 0;
            margin-top: 24px;
        }
        .insight-text { font-size: 1.05rem; line-height: 1.9; color: #333; font-weight: 500; }
        .footer { text-align: center; margin-top: 36px; padding-top: 24px; border-top: 2px solid rgba(255, 140, 0, 0.2); }
        .footer-text { font-size: 0.85rem; color: #FF6B35; font-weight: 500; }
        .sparkle { position: absolute; width: 8px; height: 8px; background: #FFD700; border-radius: 50%; animation: sparkle 2s ease-in-out infinite; }
        .sparkle:nth-child(4) { top: 15%; right: 20%; }
        .sparkle:nth-child(5) { top: 40%; left: 15%; animation-delay: 0.5s; }
        .sparkle:nth-child(6) { bottom: 20%; right: 25%; animation-delay: 1s; }
        @keyframes sparkle { 0%, 100% { transform: scale(0.5); opacity: 0.3; } 50% { transform: scale(1.2); opacity: 1; } }
        @media print {
            .page { min-height: auto; padding: 20px; }
            body { background: white; }
            .page::before, .page::after { display: none; }
            .sparkle { display: none; }
        }
    </style>
</head>
<body>
<div class="page">
    <div class="card">
        <div class="crack-line"></div>
        <div class="crack-line"></div>
        <div class="crack-line"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="header">
            <div class="head-icon">
                <svg viewBox="0 0 100 100" fill="none">
                    <path d="M50 10 C25 10 15 35 15 50 C15 70 25 85 40 90 L40 95 L60 95 L60 90 C75 85 85 70 85 50 C85 35 75 10 50 10 Z" fill="rgba(255,140,0,0.15)" stroke="rgba(255,140,0,0.6)" stroke-width="2"/>
                    <path d="M50 12 L48 28 L55 35 L47 48 L54 58 L50 70" stroke="#FF8C00" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
                    </path>
                    <path d="M48 28 L38 35" stroke="#FF8C00" stroke-width="2" fill="none" stroke-linecap="round"/>
                    <path d="M55 35 L65 32" stroke="#FF8C00" stroke-width="2" fill="none" stroke-linecap="round"/>
                    <path d="M47 48 L35 52" stroke="#FF8C00" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    <path d="M54 58 L68 55" stroke="#FF8C00" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    <circle cx="50" cy="12" r="3" fill="#FFD700"><animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite"/></circle>
                </svg>
            </div>
            <div class="logo">CRACK TIME</div>
            <div class="date">${date}</div>
        </div>
        <h1 class="name">${name}</h1>
        <div class="section">
            <div class="section-title">현재 상황</div>
            <div class="content">${situation}</div>
        </div>
        <div class="insight">
            <div class="section-title">크랙 포인트</div>
            <div class="insight-text">${crackPoint}</div>
        </div>
        <div class="footer"><div class="footer-text">머릿속에 금이 가는 순간, 새로운 시야가 열린다</div></div>
    </div>
</div>
</body>
</html>`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth (Must be first)
  setupAuth(app);
  registerAuthRoutes(app);

  // 2. Setup AI (Chat & Image)
  registerChatRoutes(app);
  registerImageRoutes(app);

  // 3. Setup Object Storage
  registerObjectStorageRoutes(app);

  // 4. App Routes

  // --- Journals ---
  app.get(api.journals.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const journals = await storage.getJournals(userId);
    res.json(journals);
  });

  app.post(api.journals.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const input = api.journals.create.input.parse({ ...req.body, userId });
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
    const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
    const tokens = await storage.getTokens(batchId);
    res.json(tokens);
  });

  app.post(api.tokens.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user.id;
      const input = api.tokens.create.input.parse({ ...req.body, fromUserId });

      // Additional validation for receiverName (must not be empty or just whitespace)
      if (!input.receiverName || typeof input.receiverName !== 'string' || input.receiverName.trim() === '') {
        return res.status(400).json({ error: "받는 사람의 이름이 유효하지 않습니다." });
      }

      // Sanitize receiverEmail - set to null if empty or invalid
      let sanitizedEmail = null;
      if (input.receiverEmail && typeof input.receiverEmail === 'string') {
        const emailTrimmed = input.receiverEmail.trim();
        if (emailTrimmed.length > 0 && emailTrimmed.includes('@')) {
          sanitizedEmail = emailTrimmed.toLowerCase();
        }
      }

      // Create token with sanitized data
      const tokenData = {
        ...input,
        receiverName: input.receiverName.trim(),
        receiverEmail: sanitizedEmail,
      };

      const token = await storage.createToken(tokenData);
      res.status(201).json(token);
    } catch (error: any) {
      console.error("Token creation error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다.", errors: error.errors });
      }
      res.status(500).json({ message: "토큰 발행에 실패했습니다." });
    }
  });

  app.post(api.tokens.accept.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const user = req.user;
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

  app.put(api.batchMembers.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.batchMembers.update.input.parse(req.body);
      const member = await storage.updateBatchMember(Number(req.params.id), input);
      res.json(member);
    } catch (error) {
      console.error("Update batch member error:", error);
      res.status(500).json({ error: "멤버 정보를 업데이트하지 못했습니다" });
    }
  });

  app.get(api.batchMembers.membershipStatus.path, isAuthenticated, async (req: any, res) => {
    try {
      const folderId = Number(req.params.folderId);
      const userId = req.user.id;
      const userEmail = req.user.email || "";
      
      const status = await storage.getUserMembershipInBatch(folderId, userId, userEmail);
      res.json(status);
    } catch (error) {
      console.error("Membership status error:", error);
      res.status(500).json({ error: "멤버십 상태를 확인하지 못했습니다" });
    }
  });

  app.post(api.batchMembers.join.path, isAuthenticated, async (req: any, res) => {
    try {
      const folderId = Number(req.params.folderId);
      const userId = req.user.id;
      const userEmail = req.user.email || "";
      const input = api.batchMembers.join.input.parse(req.body);
      
      // Check if already a member
      const existingStatus = await storage.getUserMembershipInBatch(folderId, userId, userEmail);
      if (existingStatus.isMember) {
        return res.status(400).json({ message: "이미 이 기수의 멤버입니다" });
      }
      
      const member = await storage.joinBatch(folderId, userId, userEmail, input.displayName, input.claimMemberId);
      
      if (!member) {
        return res.status(400).json({ message: "프로필 연결에 실패했습니다. 이미 다른 사용자가 연결했거나 이메일이 일치하지 않습니다." });
      }
      
      res.status(201).json(member);
    } catch (error) {
      console.error("Join batch error:", error);
      res.status(500).json({ error: "기수 가입에 실패했습니다" });
    }
  });

  // Leave batch
  app.delete(api.batchMembers.leave.path, isAuthenticated, async (req: any, res) => {
    try {
      const batchId = Number(req.params.batchId);
      const userId = req.user.id;
      
      await storage.leaveBatch(batchId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Leave batch error:", error);
      res.status(500).json({ error: "기수 탈퇴에 실패했습니다" });
    }
  });

  // Get user's batches
  app.get(api.batchMembers.userBatches.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const batches = await storage.getUserBatches(userId);
      res.json(batches);
    } catch (error) {
      console.error("Get user batches error:", error);
      res.status(500).json({ error: "기수 목록을 불러오는데 실패했습니다" });
    }
  });

  // --- Member Journals ---
  app.get(api.memberJournals.list.path, async (req, res) => {
    const journals = await storage.getJournalsByMember(Number(req.params.memberId));
    res.json(journals);
  });

  // --- Settings ---
  app.get(api.settings.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const apiKey = await storage.getUserGeminiApiKey(userId);
      res.json({ hasGeminiApiKey: !!apiKey });
    } catch (error) {
      console.error("Settings GET error:", error);
      res.status(500).json({ error: "설정을 불러오지 못했습니다" });
    }
  });

  app.put(api.settings.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const input = api.settings.update.input.parse(req.body);
      await storage.updateUserSettings(userId, { geminiApiKey: input.geminiApiKey || "" });
      res.json({ success: true });
    } catch (error) {
      console.error("Settings PUT error:", error);
      res.status(500).json({ error: "설정 저장에 실패했습니다" });
    }
  });

  // --- Crack Time with User's API Key ---
  app.post("/api/crack-time", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;
      const apiKey = await storage.getUserGeminiApiKey(userId);
      
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 먼저 입력해주세요." });
      }

      const { content, userName } = req.body;
      if (!content) {
        return res.status(400).json({ error: "고민 내용을 입력해주세요." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const today = new Date();
      const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      const displayName = userName || '사용자';

      const systemPrompt = `당신은 AGround의 성장 컨설턴트입니다. 크랙 타임은 대표님들을 위한 1장짜리 이미지 카드를 만들어주는 프로그램입니다.
문제상황과 해결방식을 분석하여 "크랙 포인트"(관점의 전환)를 제시합니다.
컨셉은 아침해와 명랑한 분위기입니다.

중요: 반드시 아래의 JSON 형식으로만 응답하세요. 다른 텍스트를 포함하지 마세요.
{
  "situation": "현재 상황을 2-3문장으로 정리",
  "crackPoint": "크랙 포인트 - 관점의 전환을 주는 핵심 인사이트. <strong>태그로 핵심 강조 가능. <br>태그로 줄바꿈 가능. 2-4문장."
}`;

      const userMessage = `${displayName} 대표님의 현재의 안개(고민 상황): "${content}"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userMessage }] }
        ],
      });

      const text = response.text || "";
      
      // Parse JSON from response
      let parsed;
      try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanText);
      } catch (e) {
        parsed = {
          situation: content,
          crackPoint: text
        };
      }

      // Generate HTML card
      const html = generateCrackTimeHtml(displayName, formattedDate, parsed.situation, parsed.crackPoint);

      res.json({ 
        html,
        situation: parsed.situation,
        crackPoint: parsed.crackPoint,
        userName: displayName,
        date: formattedDate
      });
    } catch (error: any) {
      console.error("Crack Time error:", error);
      if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API key")) {
        return res.status(401).json({ error: "API 키가 유효하지 않습니다. 설정에서 올바른 키를 입력해주세요." });
      }
      res.status(500).json({ error: "AI 분석 중 오류가 발생했습니다." });
    }
  });

  // === SHARED CONTENT (Web Sharing) ===
  
  // Create shared content (authenticated)
  app.post("/api/share", isAuthenticated, async (req, res) => {
    try {
      const { type, title, content, authorName } = req.body;
      
      if (!type || !title || !content || !authorName) {
        return res.status(400).json({ error: "모든 필드를 입력해주세요." });
      }
      
      // Generate unique ID
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
      
      const shared = await storage.createSharedContent({
        id,
        type,
        title,
        content,
        authorName,
      });
      
      res.json({ id: shared.id, url: `/share/${shared.id}` });
    } catch (error) {
      console.error("Share creation error:", error);
      res.status(500).json({ error: "공유 링크 생성에 실패했습니다." });
    }
  });
  
  // Get shared content (public - no authentication required)
  app.get("/api/share/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const shared = await storage.getSharedContent(id);
      
      if (!shared) {
        return res.status(404).json({ error: "공유된 콘텐츠를 찾을 수 없습니다." });
      }
      
      res.json(shared);
    } catch (error) {
      console.error("Share fetch error:", error);
      res.status(500).json({ error: "콘텐츠를 불러오는데 실패했습니다." });
    }
  });

  // === AI PROMPT TEMPLATES (원소스 멀티유즈) ===
  
  // Get user's prompt templates
  app.get("/api/ai/prompts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      let templates = await storage.getAiPromptTemplates(userId);
      
      // If no templates exist, create default ones
      if (!templates) {
        templates = await storage.upsertAiPromptTemplates(userId, {});
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Get prompts error:", error);
      res.status(500).json({ error: "프롬프트를 불러오는데 실패했습니다." });
    }
  });
  
  // Update user's prompt templates
  app.put("/api/ai/prompts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { youtubePrompt, threadsPrompt, reelsPrompt } = req.body;
      
      // Validate prompts are strings and reasonable length
      const maxLength = 5000;
      const validatePrompt = (prompt: any, name: string) => {
        if (prompt !== undefined && (typeof prompt !== 'string' || prompt.length > maxLength)) {
          throw new Error(`${name} 프롬프트가 유효하지 않습니다.`);
        }
      };
      
      validatePrompt(youtubePrompt, 'YouTube');
      validatePrompt(threadsPrompt, 'Threads');
      validatePrompt(reelsPrompt, 'Reels');
      
      const templates = await storage.upsertAiPromptTemplates(userId, {
        youtubePrompt,
        threadsPrompt,
        reelsPrompt,
      });
      
      res.json(templates);
    } catch (error: any) {
      console.error("Update prompts error:", error);
      if (error.message?.includes('프롬프트가 유효하지')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "프롬프트 저장에 실패했습니다." });
    }
  });
  
  // Generate multi-use content
  app.post("/api/ai/multi-use", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { content } = req.body;
      
      // Validate input
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "내용을 입력해주세요." });
      }
      
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return res.status(400).json({ error: "내용을 입력해주세요." });
      }
      
      if (trimmedContent.length > 50000) {
        return res.status(400).json({ error: "내용이 너무 깁니다. 50,000자 이하로 입력해주세요." });
      }
      
      // Get user's API key
      const apiKey = await storage.getUserGeminiApiKey(userId);
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API 키를 설정에서 먼저 입력해주세요." });
      }
      
      // Get user's prompt templates
      let templates = await storage.getAiPromptTemplates(userId);
      if (!templates) {
        templates = await storage.upsertAiPromptTemplates(userId, {});
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Generate content for each platform in parallel
      const [youtubeResult, threadsResult, reelsResult] = await Promise.all([
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: `${templates.youtubePrompt}\n\n원본 내용:\n${trimmedContent}` }] }],
        }),
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: `${templates.threadsPrompt}\n\n원본 내용:\n${trimmedContent}` }] }],
        }),
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: `${templates.reelsPrompt}\n\n원본 내용:\n${trimmedContent}` }] }],
        }),
      ]);
      
      res.json({
        youtube: youtubeResult.text ?? "",
        threads: threadsResult.text ?? "",
        reels: reelsResult.text ?? "",
      });
    } catch (error: any) {
      console.error("Multi-use generation error:", error);
      if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API key")) {
        return res.status(401).json({ error: "API 키가 유효하지 않습니다. 설정에서 올바른 키를 입력해주세요." });
      }
      res.status(500).json({ error: "콘텐츠 생성 중 오류가 발생했습니다." });
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
