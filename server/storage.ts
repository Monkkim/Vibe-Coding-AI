import { 
  users, journals, tokens, leads, folders,
  type User, type InsertUser,
  type Journal, type InsertJournal,
  type Token, type InsertToken,
  type Lead, type InsertLead,
  type Folder, type InsertFolder
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Journals
  getJournals(userId: string): Promise<Journal[]>;
  createJournal(journal: InsertJournal): Promise<Journal>;
  updateJournal(id: number, journal: Partial<InsertJournal>): Promise<Journal>;
  deleteJournal(id: number): Promise<void>;

  // Tokens
  getTokens(): Promise<(Token & { senderName: string | null, receiverName: string | null })[]>;
  createToken(token: InsertToken): Promise<Token>;

  // Leads
  getLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;

  // Folders
  getFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  deleteFolder(id: number): Promise<void>;

  // Users (for token sending)
  getAllUsers(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>[]>;
}

export class DatabaseStorage implements IStorage {
  // --- Auth Methods (Required by IAuthStorage) ---
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }

  // --- Journals ---
  async getJournals(userId: string): Promise<Journal[]> {
    return await db.select().from(journals).where(eq(journals.userId, userId)).orderBy(desc(journals.createdAt));
  }

  async createJournal(insertJournal: InsertJournal): Promise<Journal> {
    const [journal] = await db.insert(journals).values(insertJournal).returning();
    return journal;
  }

  async updateJournal(id: number, updates: Partial<InsertJournal>): Promise<Journal> {
    const [updated] = await db.update(journals).set({ ...updates, updatedAt: new Date() }).where(eq(journals.id, id)).returning();
    return updated;
  }

  async deleteJournal(id: number): Promise<void> {
    await db.delete(journals).where(eq(journals.id, id));
  }

  // --- Tokens ---
  async getTokens(): Promise<(Token & { senderName: string | null, receiverName: string | null })[]> {
    const senderAlias = alias(users, 'sender');
    const receiverAlias = alias(users, 'receiver');
    
    const results = await db
      .select({
        id: tokens.id,
        fromUserId: tokens.fromUserId,
        toUserId: tokens.toUserId,
        category: tokens.category,
        message: tokens.message,
        createdAt: tokens.createdAt,
        senderName: sql<string | null>`COALESCE(${senderAlias.firstName} || ' ' || ${senderAlias.lastName}, ${senderAlias.firstName}, 'Unknown')`.as('senderName'),
        receiverName: sql<string | null>`COALESCE(${receiverAlias.firstName} || ' ' || ${receiverAlias.lastName}, ${receiverAlias.firstName}, 'Unknown')`.as('receiverName'),
      })
      .from(tokens)
      .leftJoin(senderAlias, eq(tokens.fromUserId, senderAlias.id))
      .leftJoin(receiverAlias, eq(tokens.toUserId, receiverAlias.id))
      .orderBy(desc(tokens.createdAt));
    
    return results;
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const [token] = await db.insert(tokens).values(insertToken).returning();
    return token;
  }

  // --- Leads ---
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead> {
    const [updated] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    return updated;
  }

  // --- Folders ---
  async getFolders(): Promise<Folder[]> {
    return await db.select().from(folders).orderBy(desc(folders.createdAt));
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const [folder] = await db.insert(folders).values(insertFolder).returning();
    return folder;
  }

  async deleteFolder(id: number): Promise<void> {
    await db.delete(folders).where(eq(folders.id, id));
  }

  // --- Users ---
  async getAllUsers(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>[]> {
    return await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    }).from(users);
  }
}

export const storage = new DatabaseStorage();
