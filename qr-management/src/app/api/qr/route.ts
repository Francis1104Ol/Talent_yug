import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import QRRecord from '@/models/QRRecord';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 10)));
    const skip = (page - 1) * limit;

    const labelFilter = searchParams.get('label');
    const isActiveFilter = searchParams.get('isActive');

    // FIXED: Using direct inline query mapping to bypass mongoose version type discrepancies
    const queryConditions: Record<string, unknown> = {};

    if (labelFilter) {
      queryConditions.label = { $regex: labelFilter, $options: 'i' };
    }

    if (isActiveFilter !== null && isActiveFilter !== undefined) {
      queryConditions.isActive = isActiveFilter === 'true';
    }

    await connectDB();

    const [records, totalRecords] = await Promise.all([
      QRRecord.find(queryConditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QRRecord.countDocuments(queryConditions),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      status: 'success',
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: records,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Fetching listing collection failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Could not fetch records collection from database.';

    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: errorMessage,
      statusCode: 500,
    }, { status: 500 });
  }
}
