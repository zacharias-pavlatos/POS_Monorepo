import z from 'zod';

export const missingIdError = {
  MISSING_ID: {
    status: 404,
    data: z.object({
      postId: z.string(),
    }),
  },
} as const;
