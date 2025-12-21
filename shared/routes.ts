import { z } from 'zod';
import { insertJournalSchema, insertTokenSchema, insertLeadSchema, insertFolderSchema, journals, tokens, leads, folders } from './schema';

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
        200: z.array(z.custom<typeof tokens.$inferSelect & { senderName?: string, receiverName?: string }>()),
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
  }
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
