import { z } from 'zod';
import { insertJournalSchema, insertTokenSchema, insertLeadSchema, insertFolderSchema, insertBatchMemberSchema, journals, tokens, leads, folders, batchMembers } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  journals: {
    list: {
      method: 'GET' as const,
      path: '/api/journals',
      responses: {
        200: z.array(z.custom<typeof journals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/journals',
      input: insertJournalSchema,
      responses: {
        201: z.custom<typeof journals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/journals/:id',
      input: insertJournalSchema.partial(),
      responses: {
        200: z.custom<typeof journals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/journals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  tokens: {
    list: {
      method: 'GET' as const,
      path: '/api/tokens',
      responses: {
        200: z.array(z.custom<typeof tokens.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tokens',
      input: insertTokenSchema,
      responses: {
        201: z.custom<typeof tokens.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    accept: {
      method: 'POST' as const,
      path: '/api/tokens/:id/accept',
      responses: {
        200: z.custom<typeof tokens.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  leads: {
    list: {
      method: 'GET' as const,
      path: '/api/leads',
      responses: {
        200: z.array(z.custom<typeof leads.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/leads',
      input: insertLeadSchema,
      responses: {
        201: z.custom<typeof leads.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/leads/:id',
      input: insertLeadSchema.partial(),
      responses: {
        200: z.custom<typeof leads.$inferSelect>(),
      },
    },
  },
  folders: {
    list: {
      method: 'GET' as const,
      path: '/api/folders',
      responses: {
        200: z.array(z.custom<typeof folders.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/folders',
      input: insertFolderSchema,
      responses: {
        201: z.custom<typeof folders.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/folders/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.object({
          id: z.string(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          email: z.string().nullable(),
        })),
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.object({
          hasGeminiApiKey: z.boolean(),
        }),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/settings',
      input: z.object({
        geminiApiKey: z.string().optional(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
        }),
      },
    },
  },
  batchMembers: {
    list: {
      method: 'GET' as const,
      path: '/api/folders/:folderId/members',
      responses: {
        200: z.array(z.custom<typeof batchMembers.$inferSelect>()),
      },
    },
    listAll: {
      method: 'GET' as const,
      path: '/api/batch-members',
      responses: {
        200: z.array(z.custom<typeof batchMembers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/folders/:folderId/members',
      input: insertBatchMemberSchema,
      responses: {
        201: z.custom<typeof batchMembers.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/batch-members/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/batch-members/:id',
      input: z.object({
        name: z.string().optional(),
        email: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof batchMembers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    membershipStatus: {
      method: 'GET' as const,
      path: '/api/folders/:folderId/membership',
      responses: {
        200: z.object({
          isMember: z.boolean(),
          member: z.custom<typeof batchMembers.$inferSelect>().nullable(),
          claimableMember: z.custom<typeof batchMembers.$inferSelect>().nullable(),
        }),
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/folders/:folderId/join',
      input: z.object({
        displayName: z.string(),
        claimMemberId: z.number().optional(),
      }),
      responses: {
        201: z.custom<typeof batchMembers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    leave: {
      method: 'DELETE' as const,
      path: '/api/batches/:batchId/leave',
      responses: {
        204: z.void(),
      },
    },
    userBatches: {
      method: 'GET' as const,
      path: '/api/user/batches',
      responses: {
        200: z.array(z.object({
          batchId: z.number(),
          batchName: z.string(),
          memberId: z.number(),
          memberName: z.string(),
          joinedAt: z.string().nullable(),
        })),
      },
    },
  },
  memberJournals: {
    list: {
      method: 'GET' as const,
      path: '/api/batch-members/:memberId/journals',
      responses: {
        200: z.array(z.custom<typeof journals.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
