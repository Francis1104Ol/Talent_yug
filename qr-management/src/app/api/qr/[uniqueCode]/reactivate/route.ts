import { NextRequest } from 'next/server';
import { PATCH as basePatch } from '../route';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ uniqueCode: string }> }
) {
  return basePatch(req, context);
}
