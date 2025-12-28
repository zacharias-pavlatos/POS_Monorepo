import type { ReactElement } from 'react';

import { Resend } from 'resend';

import env from '@/lib/env';

export const resend = new Resend(env.RESEND_API_KEY as string);

export function sendEmail(opts: {
  to: string | string[];
  from?: string;
  subject: string;
  react: ReactElement;
}) {
  return resend.emails.send({
    from: opts.from ?? 'Acme <noreply@acme.com>',
    ...opts,
  });
}
