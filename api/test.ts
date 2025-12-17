import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Test] Function called!');
  res.status(200).json({ message: 'Test function works!', method: req.method, url: req.url });
}
