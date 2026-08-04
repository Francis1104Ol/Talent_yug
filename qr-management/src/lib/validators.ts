import { z } from 'zod';

export const GenerateQRSchema = z.object({
  originalUrl: z.string().url('Invalid URL format').max(2048, 'URL too long'),
  label: z.string().optional(),
  fgColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional().default('#000000'),
  bgColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional().default('#FFFFFF'),
  sizePixels: z.number().min(100).max(2000).optional().default(300),
});

export const QueryQRSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  label: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});