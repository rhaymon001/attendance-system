const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    distanceMetres: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'rejected'],
      required: true,
    },
    rejectReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index to prevent duplicate check-ins at database level
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

module.exports = AttendanceRecord;
