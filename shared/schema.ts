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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBatchMemberSchema = createInsertSchema(batchMembers).omit({ 
  id: true, 
  createdAt: true 
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
