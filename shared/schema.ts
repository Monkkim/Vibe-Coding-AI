import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth and Chat models from integrations
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === JOURNALS ===
export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // Links to users.id
  memberId: integer("member_id"), // Links to batch_members.id (optional)
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // 'tech', 'business', 'retrospective', 'etc'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJournalSchema = createInsertSchema(journals).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// === TOKENS (Peer Recognition) ===
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(), // Can be batch member name or user id
  receiverName: text("receiver_name").notNull(), // Display name
  receiverEmail: text("receiver_email"), // For matching with user's email
  senderName: text("sender_name").notNull(), // Display name
  amount: integer("amount").notNull().default(10000), // Amount in won (만원 unit)
  category: text("category").notNull(), // 'influence', 'growth', 'execution', 'camaraderie'
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted'
  batchId: integer("batch_id"), // Links to folders.id (batch)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTokenSchema = createInsertSchema(tokens).omit({ 
  id: true, 
  createdAt: true 
});

// === LEADS (CRM / Sales Machine) ===
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(), // 'new', 'consulting', 'closing', 'registered'
  value: integer("value").notNull(), // Deal value
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ 
  id: true, 
  createdAt: true 
});

// === FOLDERS (Batch Manager) ===
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"), // For nested folders if needed
  type: text("type").notNull(), // 'batch', 'student'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFolderSchema = createInsertSchema(folders).omit({ 
  id: true, 
  createdAt: true 
});

// === BATCH MEMBERS ===
export const batchMembers = pgTable("batch_members", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id").notNull(), // Links to folders.id
  name: text("name").notNull(),
  email: text("email"),
  userId: varchar("user_id"), // Links to users.id when user joins the batch
  joinedAt: timestamp("joined_at"), // When the user joined (authenticated)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBatchMemberSchema = createInsertSchema(batchMembers).omit({ 
  id: true, 
  createdAt: true,
  joinedAt: true,
});

// === SHARED CONTENT (Web Sharing) ===
export const sharedContent = pgTable("shared_content", {
  id: text("id").primaryKey(), // UUID-style unique share ID
  type: text("type").notNull(), // 'cracktime' or 'journal'
  title: text("title").notNull(),
  content: text("content").notNull(), // HTML or text content
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSharedContentSchema = createInsertSchema(sharedContent).omit({ 
  createdAt: true 
});

// === RELATIONS ===
export const journalsRelations = relations(journals, ({ one }) => ({
  author: one(users, {
    fields: [journals.userId],
    references: [users.id],
  }),
}));

export const tokensRelations = relations(tokens, ({ one }) => ({
  sender: one(users, {
    fields: [tokens.fromUserId],
    references: [users.id],
    relationName: "sentTokens",
  },),
  receiver: one(users, {
    fields: [tokens.toUserId],
    references: [users.id],
    relationName: "receivedTokens",
  }),
}));

// === AI PROMPT TEMPLATES (원소스 멀티유즈) ===
export const aiPromptTemplates = pgTable("ai_prompt_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  youtubePrompt: text("youtube_prompt").notNull().default("당신은 유튜브 콘텐츠 전문가입니다. 다음 내용을 기반으로 시청자의 관심을 끄는 유튜브 대본을 작성해주세요. 인트로, 본론, 결론 구조로 작성하고, 시청자 참여를 유도하는 멘트를 포함해주세요."),
  threadsPrompt: text("threads_prompt").notNull().default("당신은 SNS 콘텐츠 전문가입니다. 다음 내용을 기반으로 쓰레드에 올릴 짧고 임팩트 있는 글을 작성해주세요. 500자 이내로, 핵심 메시지가 잘 전달되도록 작성해주세요."),
  reelsPrompt: text("reels_prompt").notNull().default("당신은 인스타그램 릴스 전문가입니다. 다음 내용을 기반으로 15-60초 분량의 릴스 대본을 작성해주세요. 짧고 강렬한 훅, 핵심 내용, 행동 유도 문구를 포함해주세요."),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiPromptTemplateSchema = createInsertSchema(aiPromptTemplates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

// === TYPES ===
export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type BatchMember = typeof batchMembers.$inferSelect;
export type InsertBatchMember = z.infer<typeof insertBatchMemberSchema>;

export type SharedContent = typeof sharedContent.$inferSelect;
export type InsertSharedContent = z.infer<typeof insertSharedContentSchema>;

export type AiPromptTemplate = typeof aiPromptTemplates.$inferSelect;
export type InsertAiPromptTemplate = z.infer<typeof insertAiPromptTemplateSchema>;
