import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Allowed image formats based on the requirement sheet
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB Max Limit

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('logo') as File | null;

    // 1. Error Handler: Missing File Input
    if (!file) {
      return NextResponse.json({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'No file found under the "logo" field key.',
        statusCode: 400,
      }, { status: 400 });
    }

    // 2. Error Handler: Invalid MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: true,
        code: 'INVALID_FILE_TYPE',
        message: 'Unsupported image type. Please upload a PNG, JPEG, or SVG.',
        statusCode: 400,
      }, { status: 400 });
    }

    // 3. Error Handler: File Too Massive
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: true,
        code: 'FILE_TOO_LARGE',
        message: 'The uploaded file exceeds the maximum allowed size of 2MB.',
        statusCode: 400,
      }, { status: 400 });
    }

    // Convert file contents to buffer stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Set up safe, clean local file system names and paths
    const sanitizedFilename = `logo-${Date.now()}${path.extname(file.name)}`;
    const relativeStorageDir = path.join('storage', 'logos');
    const absoluteStorageDir = path.join(process.cwd(), 'public', relativeStorageDir);

    // Build directory paths recursively if missing
    await fs.mkdir(absoluteStorageDir, { recursive: true });

    const absoluteFilePath = path.join(absoluteStorageDir, sanitizedFilename);
    // Standardize URL paths to use forward slashes for cross-platform stability
    const publicAssetUrlPath = path.join(relativeStorageDir, sanitizedFilename).replace(/\\/g, '/');

    // Write file directly to local filesystem disk storage
    await fs.writeFile(absoluteFilePath, buffer);

    // Return successfully structured file data object
    return NextResponse.json({
      status: 'success',
      message: 'Logo uploaded and saved successfully.',
      logoUrl: publicAssetUrlPath,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Logo upload transaction failed:', error);
    
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Processing upload file transaction failed.',
      statusCode: 500,
    }, { status: 500 });
  }
}
