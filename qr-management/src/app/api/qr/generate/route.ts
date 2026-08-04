import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import mongoose from 'mongoose'; // FIXED: Importing mongoose directly for hydration types
import { connectDB } from '../../../../lib/db';
import QRRecord from '../../../../models/QRRecord'; // FIXED: Removed the faulty named import entirely
import { GenerateQRSchema } from '../../../../lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate incoming form parameters with your existing Zod layout schema
    const validation = GenerateQRSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: true,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data matching template schema configuration',
          errors: validation.error.flatten().fieldErrors,
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const { originalUrl, label, fgColor, bgColor, sizePixels } = validation.data;

    await connectDB();

    // 2. Self-Contained 12-Character Alphanumeric Uppercase Code Sequence Generator
    const alphanumericAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let uniqueCode = '';
    let isUnique = false;
    let loopAttempts = 0;

    while (!isUnique && loopAttempts < 10) {
      loopAttempts++;
      let tempCode = '';
      for (let i = 0; i < 12; i++) {
        const randomIndex = Math.floor(Math.random() * alphanumericAlphabet.length);
        tempCode += alphanumericAlphabet.charAt(randomIndex);
      }
      
      const duplicateRecord = await QRRecord.findOne({ uniqueCode: tempCode }).lean();
      if (!duplicateRecord) {
        uniqueCode = tempCode;
        isUnique = true;
      }
    }

    if (!isUnique) {
      return NextResponse.json({
        error: true,
        code: 'GENERATION_FAILURE',
        message: 'Could not create a unique layout sequence due to heavy system load.',
        statusCode: 500
      }, { status: 500 });
    }

    // 3. Construct the dynamic internal verification tracking path
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/verify/${uniqueCode}`;

    // 4. Formulate destination paths for asset storage files
    const targetFilename = `qr-${uniqueCode}.png`;
    const relativeStorageDir = path.join('storage', 'qrcodes');
    const absoluteStorageDir = path.join(process.cwd(), 'public', relativeStorageDir);
    
    await fs.mkdir(absoluteStorageDir, { recursive: true });
    
    const absoluteImagePath = path.join(absoluteStorageDir, targetFilename);
    const dbImageStoragePath = path.join(relativeStorageDir, targetFilename).replace(/\\/g, '/');

    // 5. Generate QR Code image array streams natively via 'qrcode'
    const finalQrImageBuffer = await QRCode.toBuffer(trackingUrl, {
      type: 'png',
      margin: 2,
      width: Number(sizePixels || 512),
      color: {
        dark: fgColor || '#000000',
        light: bgColor || '#FFFFFF',
      },
    });

    await fs.writeFile(absoluteImagePath, finalQrImageBuffer);

    // 6. Map flat parameters matching your base collection expectations
    const databasePayload: Record<string, unknown> = {
      uniqueCode,
      originalUrl,
      trackingUrl,
      label: label || '',
      dotShape: 'square',
      eyeOuterShape: 'square',
      eyeInnerShape: 'square',
      fgColor: fgColor || '#000000',
      bgColor: bgColor || '#FFFFFF',
      overallShape: 'square',
      errorCorrection: 'M',
      outputSize: Number(sizePixels || 512),
      imageStoragePath: dbImageStoragePath,
      scanCount: 0,
      scanLogs: [],
      isActive: true,
    };

    // FIXED: Using HydratedDocument combined with 'any' block protection rules
    const qrRecord = (await QRRecord.create(databasePayload)) as unknown as mongoose.HydratedDocument<Record<string, unknown>>;

    // Helper to safely extract properties from the document wrapper
    const recordData = qrRecord.toObject() as Record<string, unknown>;

    return NextResponse.json(
      {
        success: true,
        data: {
          uniqueCode: recordData.uniqueCode,
          originalUrl: recordData.originalUrl,
          trackingUrl: recordData.trackingUrl,
          label: recordData.label,
          imageStoragePath: recordData.imageStoragePath,
          isActive: recordData.isActive,
          createdAt: recordData.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error generating QR:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';

    return NextResponse.json(
      {
        error: true,
        code: 'INTERNAL_SERVER_ERROR',
        message: errorMessage,
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
