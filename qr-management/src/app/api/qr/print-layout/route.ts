import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import PDFDocument from 'pdfkit';
import { connectDB } from '@/lib/db';
import QRRecord from '@/models/QRRecord';

// Predefined paper sizes at standard 72 points per inch
const PAPER_DIMENSIONS: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  LETTER: [612.00, 792.00],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      paperSize = 'A4',
      customWidth,
      customHeight,
      columns = 3,
      rows = 4,
      qrCodes = [],
      showLabel = true,
      showUniqueCode = true,
      margin = 20,
      padding = 10,
    } = body;

    if (!Array.isArray(qrCodes) || qrCodes.length === 0) {
      return NextResponse.json({
        error: true,
        code: 'INVALID_INPUT',
        message: 'Please provide an array of uniqueCodes in the "qrCodes" field.',
        statusCode: 400,
      }, { status: 400 });
    }

    const dimensions = PAPER_DIMENSIONS[paperSize.toUpperCase()] || [
      Number(customWidth || 595),
      Number(customHeight || 842),
    ];
    const [pageW, pageH] = dimensions;

    await connectDB();

    const records = await QRRecord.find({
      uniqueCode: { $in: qrCodes.map((c: string) => c.toUpperCase().trim()) },
    }).lean();

    if (!records || records.length === 0) {
      return NextResponse.json({
        error: true,
        code: 'QR_NOT_FOUND',
        message: 'None of the provided uniqueCodes were found in the database.',
        statusCode: 404,
      }, { status: 404 });
    }

    const orderedRecords = qrCodes
      .map(code => records.find(r => r.uniqueCode === code.toUpperCase().trim()))
      .filter(Boolean);

    const totalCols = Number(columns);
    const totalRows = Number(rows);
    const cellW = (pageW - (totalCols + 1) * margin) / totalCols;
    const cellH = (pageH - (totalRows + 1) * margin) / totalRows;

    const labelHeight = (showLabel || showUniqueCode) ? 15 : 0;
    const qrSize = Math.min(cellW - padding * 2, cellH - padding * 2 - labelHeight);
    const maxPerPage = totalCols * totalRows;

    const doc = new PDFDocument({
      size: dimensions,
      margins: { top: 0, left: 0, right: 0, bottom: 0 },
      autoFirstPage: false,
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    for (let index = 0; index < orderedRecords.length; index++) {
      const record = orderedRecords[index];
      if (!record) continue;

      const pageIndex = index % maxPerPage;
      
      if (pageIndex === 0) {
        doc.addPage();
      }

      const col = pageIndex % totalCols;
      const row = Math.floor(pageIndex / totalCols);

      const cellX = margin + col * (cellW + margin);
      const cellY = margin + row * (cellH + margin);

      const posX = cellX + (cellW - qrSize) / 2;
      const posY = cellY + padding;

      const storagePath = record.imageStoragePath || '';
      if (storagePath) {
        const absoluteImagePath = path.join(process.cwd(), 'public', storagePath);
        try {
          await fs.access(absoluteImagePath);
          doc.image(absoluteImagePath, posX, posY, { width: qrSize, height: qrSize });
        } catch {
          doc.rect(posX, posY, qrSize, qrSize).stroke('#cccccc');
        }
      }

      if (showLabel || showUniqueCode) {
        const textLabel = showLabel ? (record.label || '') : '';
        const textCode = showUniqueCode ? `[${record.uniqueCode}]` : '';
        const caption = `${textLabel} ${textCode}`.trim();

        doc.fillColor('#000000')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(caption, cellX, posY + qrSize + 4, {
             width: cellW,
             align: 'center',
           });
      }
    }

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

     return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="print-layout-${paperSize}.pdf"`,
      },
    });

  } catch (error: unknown) {
    console.error('Print Layout distribution process failed:', error);
    const msg = error instanceof Error ? error.message : 'Internal print processing failure.';
    
    return NextResponse.json({
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: msg,
      statusCode: 500,
    }, { status: 500 });
  }
}
