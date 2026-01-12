import { 
  users, journals, tokens, leads, folders, batchMembers, sharedContent, aiPromptTemplates,
  type User,
  type Journal, type InsertJournal,
  type Token, type InsertToken,
  type Lead, type InsertLead,
  type Folder, type InsertFolder,
  type BatchMember, type InsertBatchMember,
  type SharedContent, type InsertSharedContent,
  type AiPromptTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Journals
  getJournals(userId: string): Promise<Journal[]>;
  createJournal(journal: InsertJournal): Promise<Journal>;
  updateJournal(id: number, journal: Partial<InsertJournal>): Promise<Journal>;
  deleteJournal(id: number): Promise<void>;

  // Tokens
  getTokens(batchId?: number): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  acceptToken(id: number): Promise<Token>;

  // Leads
  getLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;

  // Folders
  getFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  deleteFolder(id: number): Promise<void>;

  // Batch Members
  getBatchMembers(folderId: number): Promise<BatchMember[]>;
  getAllBatchMembers(): Promise<BatchMember[]>;
  createBatchMember(member: InsertBatchMember): Promise<BatchMember>;
  deleteBatchMember(id: number): Promise<void>;
  updateBatchMember(id: number, updates: Partial<InsertBatchMember & { userId?: string; joinedAt?: Date }>): Promise<BatchMember>;
  getUserMembershipInBatch(folderId: number, userId: string, userEmail: string): Promise<{ isMember: boolean; member: BatchMember | null; claimableMember: BatchMember | null }>;
  joinBatch(folderId: number, userId: string, userEmail: string, displayName: string, claimMemberId?: number): Promise<BatchMember | null>;
  
  // Journals by member
  getJournalsByMember(memberId: number): Promise<Journal[]>;
  
  // Leave batch (removes member and their tokens)
  leaveBatch(batchId: number, userId: string): Promise<void>;
  
  // Get user's batches
  getUserBatches(userId: string): Promise<{ batchId: number; batchName: string; memberId: number; memberName: string; joinedAt: Date | null }[]>;

  // Users (for token sending)
  getAllUsers(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>[]>;

  // Settings
  updateUserSettings(userId: string, settings: { geminiApiKey?: string }): Promise<User>;
  getUserGeminiApiKey(userId: string): Promise<string | null>;

  // Shared Content (Web Sharing)
  createSharedContent(content: InsertSharedContent): Promise<SharedContent>;
  getSharedContent(id: string): Promise<SharedContent | null>;

  // AI Prompt Templates (원소스 멀티유즈)
  getAiPromptTemplates(userId: string): Promise<AiPromptTemplate | null>;
  upsertAiPromptTemplates(userId: string, templates: Partial<{
    youtubePrompt: string;
    threadsPrompt: string;
    reelsPrompt: string;
  }>): Promise<AiPromptTemplate>;
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
  async getTokens(batchId?: number): Promise<Token[]> {
    if (batchId) {
      return await db.select().from(tokens).where(eq(tokens.batchId, batchId)).orderBy(desc(tokens.createdAt));
    }
    return await db.select().from(tokens).orderBy(desc(tokens.createdAt));
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const [token] = await db.insert(tokens).values(insertToken).returning();
    return token;
  }

  async acceptToken(id: number): Promise<Token> {
    const [token] = await db.update(tokens).set({ status: "accepted" }).where(eq(tokens.id, id)).returning();
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
    // Also delete all members in this folder
    await db.delete(batchMembers).where(eq(batchMembers.folderId, id));
    await db.delete(folders).where(eq(folders.id, id));
  }

  // --- Batch Members ---
  async getBatchMembers(folderId: number): Promise<BatchMember[]> {
    return await db.select().from(batchMembers).where(eq(batchMembers.folderId, folderId)).orderBy(desc(batchMembers.createdAt));
  }

  async getAllBatchMembers(): Promise<BatchMember[]> {
    return await db.select().from(batchMembers).orderBy(batchMembers.name);
  }

  async createBatchMember(insertMember: InsertBatchMember): Promise<BatchMember> {
    const [member] = await db.insert(batchMembers).values(insertMember).returning();
    return member;
  }

  async deleteBatchMember(id: number): Promise<void> {
    await db.delete(batchMembers).where(eq(batchMembers.id, id));
  }

  async updateBatchMember(id: number, updates: Partial<InsertBatchMember & { userId?: string; joinedAt?: Date }>): Promise<BatchMember> {
    const [updated] = await db.update(batchMembers).set(updates).where(eq(batchMembers.id, id)).returning();
    
    // If name was updated, sync receiverName in all tokens that reference this member
    if (updates.name) {
      // Update tokens where toUserId matches member id (string format)
      await db.update(tokens)
        .set({ receiverName: updates.name })
        .where(eq(tokens.toUserId, id.toString()));
      
      // Also update by receiverEmail if the member has an email
      if (updated.email) {
        await db.update(tokens)
          .set({ receiverName: updates.name })
          .where(eq(tokens.receiverEmail, updated.email));
      }
      
      // Also update by userId if the member has a linked user account
      if (updated.userId) {
        await db.update(tokens)
          .set({ receiverName: updates.name })
          .where(eq(tokens.toUserId, updated.userId));
      }
    }
    
    return updated;
  }

  async getUserMembershipInBatch(folderId: number, userId: string, userEmail: string): Promise<{ isMember: boolean; member: BatchMember | null; claimableMember: BatchMember | null }> {
    // Check if user is already a member by userId
    const membersByUserId = await db.select().from(batchMembers)
      .where(and(eq(batchMembers.folderId, folderId), eq(batchMembers.userId, userId)));
    
    if (membersByUserId.length > 0) {
      return { isMember: true, member: membersByUserId[0], claimableMember: null };
    }

    // Check if there's an unclaimed member with matching email that user can claim
    const membersByEmail = await db.select().from(batchMembers)
      .where(and(
        eq(batchMembers.folderId, folderId),
        eq(batchMembers.email, userEmail.toLowerCase()),
        isNull(batchMembers.userId)
      ));

    if (membersByEmail.length > 0) {
      return { isMember: false, member: null, claimableMember: membersByEmail[0] };
    }

    return { isMember: false, member: null, claimableMember: null };
  }

  async joinBatch(folderId: number, userId: string, userEmail: string, displayName: string, claimMemberId?: number): Promise<BatchMember | null> {
    // If claiming an existing member - validate ownership by folderId, email, and userId is null
    if (claimMemberId) {
      const [claimed] = await db.update(batchMembers)
        .set({ userId, joinedAt: new Date() })
        .where(and(
          eq(batchMembers.id, claimMemberId),
          eq(batchMembers.folderId, folderId),
          eq(batchMembers.email, userEmail.toLowerCase()),
          isNull(batchMembers.userId)
        ))
        .returning();
      
      // Return null if no rows were updated (validation failed)
      if (!claimed) {
        return null;
      }
      return claimed;
    }

    // Create new member
    const [member] = await db.insert(batchMembers).values({
      folderId,
      name: displayName,
      email: userEmail.toLowerCase(),
      userId,
      joinedAt: new Date(),
    }).returning();
    return member;
  }

  // --- Journals by Member ---
  async getJournalsByMember(memberId: number): Promise<Journal[]> {
    return await db.select().from(journals).where(eq(journals.memberId, memberId)).orderBy(desc(journals.createdAt));
  }

  // --- Leave Batch ---
  async leaveBatch(batchId: number, userId: string): Promise<void> {
    // Only delete the batch member record
    // Tokens are preserved for history
    await db.delete(batchMembers).where(
      and(
        eq(batchMembers.folderId, batchId),
        eq(batchMembers.userId, userId)
      )
    );
  }

  // --- Get User's Batches ---
  async getUserBatches(userId: string): Promise<{ batchId: number; batchName: string; memberId: number; memberName: string; joinedAt: Date | null }[]> {
    const result = await db.select({
      batchId: folders.id,
      batchName: folders.name,
      memberId: batchMembers.id,
      memberName: batchMembers.name,
      joinedAt: batchMembers.joinedAt,
    })
    .from(batchMembers)
    .innerJoin(folders, eq(batchMembers.folderId, folders.id))
    .where(eq(batchMembers.userId, userId))
    .orderBy(desc(batchMembers.joinedAt));
    
    return result;
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

  // --- Settings ---
  async updateUserSettings(userId: string, settings: { geminiApiKey?: string }): Promise<User> {
    const [updated] = await db.update(users).set({ 
      geminiApiKey: settings.geminiApiKey,
      updatedAt: new Date() 
    }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async getUserGeminiApiKey(userId: string): Promise<string | null> {
    const [user] = await db.select({ geminiApiKey: users.geminiApiKey }).from(users).where(eq(users.id, userId));
    return user?.geminiApiKey || null;
  }

  // --- Shared Content (Web Sharing) ---
  async createSharedContent(content: InsertSharedContent): Promise<SharedContent> {
    const [shared] = await db.insert(sharedContent).values(content).returning();
    return shared;
  }

  async getSharedContent(id: string): Promise<SharedContent | null> {
    const [shared] = await db.select().from(sharedContent).where(eq(sharedContent.id, id));
    return shared || null;
  }

  // --- AI Prompt Templates (원소스 멀티유즈) ---
  async getAiPromptTemplates(userId: string): Promise<AiPromptTemplate | null> {
    const [template] = await db.select().from(aiPromptTemplates).where(eq(aiPromptTemplates.userId, userId));
    return template || null;
  }

  async upsertAiPromptTemplates(userId: string, templates: Partial<{
    youtubePrompt: string;
    threadsPrompt: string;
    reelsPrompt: string;
  }>): Promise<AiPromptTemplate> {
    const [result] = await db
      .insert(aiPromptTemplates)
      .values({ userId, ...templates })
      .onConflictDoUpdate({
        target: aiPromptTemplates.userId,
        set: { ...templates, updatedAt: new Date() },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
