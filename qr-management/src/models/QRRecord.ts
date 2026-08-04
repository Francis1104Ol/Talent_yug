import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScanLog {
  scannedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface IQRRecord extends Document {
  uniqueCode: string;
  originalUrl: string;
  trackingUrl: string;
  label?: string;
  fgColor: string;
  bgColor: string;
  sizePixels: number;
  imageStoragePath: string;
  scanCount: number;
  scanLogs: IScanLog[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScanLogSchema = new Schema<IScanLog>(
  {
    scannedAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: 'Unknown' },
    userAgent: { type: String, default: 'Unknown' },
  },
  { _id: false }
);

const QRRecordSchema = new Schema<IQRRecord>(
  {
    uniqueCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    trackingUrl: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: '',
    },
    fgColor: {
      type: String,
      default: '#000000',
    },
    bgColor: {
      type: String,
      default: '#FFFFFF',
    },
    sizePixels: {
      type: Number,
      default: 300,
    },
    imageStoragePath: {
      type: String,
      required: true,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    scanLogs: [ScanLogSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const QRRecord: Model<IQRRecord> =
  mongoose.models.QRRecord || mongoose.model<IQRRecord>('QRRecord', QRRecordSchema);

export default QRRecord;