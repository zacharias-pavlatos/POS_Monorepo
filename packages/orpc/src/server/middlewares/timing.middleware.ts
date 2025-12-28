import { os } from '@orpc/server';

export const timingMiddleware = os.middleware(async ({ next, path }) => {
  const start = Date.now();
  let waitMsDisplay = '';

  if (process.env.NODE_ENV !== 'production') {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise(resolve => setTimeout(resolve, waitMs));
    waitMsDisplay = ` (artificial delay: ${waitMs}ms)`;
  }

  const result = await next();
  const end = Date.now();

  console.log(
    `\t[RPC] /${path.join('/')} executed after ${end - start}ms${waitMsDisplay}`
  );

  return result;
});
