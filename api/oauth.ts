import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // OAuth callback endpoint
  // This is a placeholder - implement OAuth logic as needed
  res.status(200).json({ message: 'OAuth endpoint' });
}
