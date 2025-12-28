import { createAuth } from '@repo/auth/server';

import env from '@/lib/env';

import { db } from './db';

export const auth = createAuth({
  webUrl: env.CLIENT_URL,
  baseURL: env.SERVER_URL + '/auth',
  authSecret: env.BETTER_AUTH_SECRET,
  db,
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
      // Optional
      appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER,
    },
    microsoft: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      // Optional
      tenantId: 'common',
      authority: 'https://login.microsoftonline.com', // Authentication authority URL
      prompt: 'select_account', // Forces account selection
    },
  },
});

export type Auth = ReturnType<typeof createAuth>;
