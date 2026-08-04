import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import QRRecord from '@/models/QRRecord';

/**
 * 🔍 1. GET /api/qr/:uniqueCode
 * Retrieves full details and operational metadata for a single item.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uniqueCode: string }> }
) {
  try {
    const { uniqueCode } = await context.params;
    const uppercaseCode = uniqueCode.toUpperCase().trim();

    await connectDB();
    const record = await QRRecord.findOne({ uniqueCode: uppercaseCode }).lean();

    if (!record) {
      return NextResponse.json({
        error: true,
        code: 'QR_NOT_FOUND',
        message: `No record found matching identifier code: ${uppercaseCode}`,
        statusCode: 404,
      }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', data: record }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve item parameters.';
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: msg,
      statusCode: 500,
    }, { status: 500 });
  }
}

/**
 * 🗑️ 2. DELETE /api/qr/:uniqueCode
 * Deactivates (soft deletes) a specific QR code token.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ uniqueCode: string }> }
) {
  try {
    const { uniqueCode } = await context.params;
    const uppercaseCode = uniqueCode.toUpperCase().trim();

    await connectDB();
    const record = await QRRecord.findOneAndUpdate(
      { uniqueCode: uppercaseCode },
      { isActive: false },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({
        error: true,
        code: 'QR_NOT_FOUND',
        message: 'Could not find the target code to deactivate.',
        statusCode: 404,
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'QR code successfully deactivated.',
      data: { uniqueCode: record.uniqueCode, isActive: record.isActive }
    }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Soft delete operation failed.';
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: msg,
      statusCode: 500,
    }, { status: 500 });
  }
}

/**
 * 🔄 3. PATCH /api/qr/:uniqueCode
 * Reactivates a previously soft-deleted/deactivated QR record.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ uniqueCode: string }> }
) {
  try {
    const { uniqueCode } = await context.params;
    const uppercaseCode = uniqueCode.toUpperCase().trim();

    await connectDB();
    const record = await QRRecord.findOneAndUpdate(
      { uniqueCode: uppercaseCode },
      { isActive: true },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({
        error: true,
        code: 'QR_NOT_FOUND',
        message: 'Could not find the target code to reactivate.',
        statusCode: 404,
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'QR code successfully reactivated and live.',
      data: { uniqueCode: record.uniqueCode, isActive: record.isActive }
    }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Reactivation operation execution failed.';
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: msg,
      statusCode: 500,
    }, { status: 500 });
  }
}
