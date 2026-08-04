import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import QRRecord from '@/models/QRRecord';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uniqueCode: string }> }
) {
  try {
    const { uniqueCode } = await context.params;
    const uppercaseCode = uniqueCode.toUpperCase().trim();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 10)));
    const skip = (page - 1) * limit;

    await connectDB();

    // Query record explicitly to handle logging arrays dynamically
    const record = await QRRecord.findOne({ uniqueCode: uppercaseCode }).lean();

    if (!record) {
      return NextResponse.json({
        error: true,
        code: 'QR_NOT_FOUND',
        message: 'No record found to fetch scan statistics logs.',
        statusCode: 404,
      }, { status: 404 });
    }

    const logs = record.scanLogs || [];
    const totalLogs = logs.length;
    
    // Sort array log entries chronologically (newest entries first)
    const sortedLogs = [...logs].sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());
    const paginatedLogs = sortedLogs.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalLogs / limit);

    return NextResponse.json({
      status: 'success',
      pagination: {
        totalRecords: totalLogs,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
      data: paginatedLogs,
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal analytics extraction error.';
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: msg,
      statusCode: 500,
    }, { status: 500 });
  }
}
