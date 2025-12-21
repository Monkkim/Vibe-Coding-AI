import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { isAuthenticated } from "./replit_integrations/auth";

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
