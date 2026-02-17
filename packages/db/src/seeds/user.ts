export default async function seedDevUser() {
  // Call your existing signup endpoint (recommended)
  const baseUrl = 'http://localhost:3001';

  const res = await fetch(`${baseUrl}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Dev',
      email: 'dev@test.com',
      password: 'developer123',
      rememberMe: true,
    }),
    // important: avoid caching during seed
    cache: 'no-store',
  });

  // If user already exists, your API should return 409 (or similar).
  if (res.status === 409) return;

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Seed signup failed: ${res.status} ${text}`);
  }
  console.log('✅ Dev user seeded');
}

seedDevUser();
/*
To login in order to get a session token:

POST http://localhost:3000/api/auth/sign-in/email
Content-Type: application/json
{
  "email": "dev@test.com",
  "password": "dev123"
}
*/
