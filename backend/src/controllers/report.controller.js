const PDFDocument = require('pdfkit');
const json2csv = require('json2csv');
const Course = require('../models/Course');
const Session = require('../models/Session');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const logAudit = require('../utils/auditLogger');

/**
 * Helper to compute course attendance statistics with ownership verification.
 */
const computeCourseAttendanceStats = async (courseId, user) => {
  const course = await Course.findById(courseId).populate('enrolledStudents', 'name matricNo email department level');

  if (!course) {
    return { status: 404, message: 'Course not found' };
  }

  // Ownership check: only assigned lecturer or admin can access course reports
  if (user.role !== 'admin' && course.lecturerId.toString() !== user._id.toString()) {
    return { status: 403, message: 'Forbidden: You do not own this course' };
  }

  const sessions = await Session.find({ courseId });
  const totalSessions = sessions.length;
  const sessionIds = sessions.map((s) => s._id);

  const attendanceCounts = await AttendanceRecord.aggregate([
    {
      $match: {
        sessionId: { $in: sessionIds },
        status: 'present',
      },
    },
    {
      $group: {
        _id: '$studentId',
        attended: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map();
  for (const item of attendanceCounts) {
    countMap.set(item._id.toString(), item.attended);
  }

  const studentMap = new Map();

  if (course.enrolledStudents && course.enrolledStudents.length > 0) {
    for (const student of course.enrolledStudents) {
      studentMap.set(student._id.toString(), student);
    }
  }

  for (const item of attendanceCounts) {
    const sId = item._id.toString();
    if (!studentMap.has(sId)) {
      const studentDoc = await User.findById(item._id).select('name matricNo email department level');
      if (studentDoc) {
        studentMap.set(sId, studentDoc);
      }
    }
  }

  const stats = [];
  for (const [studentId, student] of studentMap.entries()) {
    const attended = countMap.get(studentId) || 0;
    const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
    stats.push({
      student: {
        _id: student._id,
        name: student.name,
        matricNo: student.matricNo,
        email: student.email,
        department: student.department,
        level: student.level,
      },
      totalSessions,
      attended,
      percentage,
    });
  }

  return { status: 200, course, totalSessions, stats };
};

/**
 * getCourseStats
 * --------------
 * GET /api/reports/:courseId
 * - Enforces course ownership
 * - Aggregates AttendanceRecords grouped by studentId for courseId
 * - Returns array: [{ student, totalSessions, attended, percentage }]
 */
const getCourseStats = async (req, res) => {
  const result = await computeCourseAttendanceStats(req.params.courseId, req.user);

  if (result.status !== 200) {
    return res.status(result.status).json({
      message: result.message,
      ...(result.status === 403 ? { reason: 'forbidden_ownership' } : {}),
    });
  }

  return res.status(200).json(result.stats);
};

/**
 * exportCSV
 * ---------
 * GET /api/reports/:courseId/export/csv
 * - Enforces course ownership
 * - Generates CSV attachment
 * - Records audit log
 */
const exportCSV = async (req, res) => {
  const result = await computeCourseAttendanceStats(req.params.courseId, req.user);

  if (result.status !== 200) {
    return res.status(result.status).json({
      message: result.message,
      ...(result.status === 403 ? { reason: 'forbidden_ownership' } : {}),
    });
  }

  const rows = result.stats.map((item) => ({
    name: item.student.name,
    matricNo: item.student.matricNo || 'N/A',
    email: item.student.email,
    totalSessions: item.totalSessions,
    attended: item.attended,
    percentage: `${item.percentage}%`,
  }));

  let csvContent;
  if (json2csv.Parser) {
    const parser = new json2csv.Parser({
      fields: [
        { label: 'Student Name', value: 'name' },
        { label: 'Matric No', value: 'matricNo' },
        { label: 'Email', value: 'email' },
        { label: 'Total Sessions', value: 'totalSessions' },
        { label: 'Attended', value: 'attended' },
        { label: 'Percentage', value: 'percentage' },
      ],
    });
    csvContent = parser.parse(rows);
  } else if (typeof json2csv.parse === 'function') {
    csvContent = json2csv.parse(rows);
  } else {
    const headers = 'Student Name,Matric No,Email,Total Sessions,Attended,Percentage\n';
    const lines = rows.map((r) => `"${r.name}","${r.matricNo}","${r.email}",${r.totalSessions},${r.attended},"${r.percentage}"`).join('\n');
    csvContent = headers + lines;
  }

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'REPORT_EXPORT_CSV',
    targetType: 'Course',
    targetId: result.course._id,
    result: 'success',
    metadata: {
      courseCode: result.course.code,
      totalSessions: result.totalSessions,
      studentsCount: result.stats.length,
    },
  });

  res.setHeader('Content-Type', 'text/csv');
  res.attachment('report.csv');
  return res.send(csvContent);
};

/**
 * exportPDF
 * ---------
 * GET /api/reports/:courseId/export/pdf
 * - Enforces course ownership
 * - Generates PDFKit table attachment
 * - Records audit log
 */
const exportPDF = async (req, res) => {
  const result = await computeCourseAttendanceStats(req.params.courseId, req.user);

  if (result.status !== 200) {
    return res.status(result.status).json({
      message: result.message,
      ...(result.status === 403 ? { reason: 'forbidden_ownership' } : {}),
    });
  }

  const { course, totalSessions, stats } = result;

  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.attachment('report.pdf');

  doc.pipe(res);

  doc.fontSize(18).text('Attendance Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).text(`${course.title} (${course.code})`, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Total Sessions: ${totalSessions}`, { align: 'center' });
  doc.moveDown(1.5);

  const tableTop = doc.y;
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Name', 40, tableTop, { width: 150 });
  doc.text('Matric No', 190, tableTop, { width: 100 });
  doc.text('Total Sessions', 290, tableTop, { width: 80, align: 'center' });
  doc.text('Attended', 370, tableTop, { width: 70, align: 'center' });
  doc.text('Percentage', 440, tableTop, { width: 80, align: 'center' });

  doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let yPosition = tableTop + 25;
  doc.font('Helvetica');

  for (const item of stats) {
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 40;
    }
    doc.text(item.student.name || 'N/A', 40, yPosition, { width: 150 });
    doc.text(item.student.matricNo || 'N/A', 190, yPosition, { width: 100 });
    doc.text(String(item.totalSessions), 290, yPosition, { width: 80, align: 'center' });
    doc.text(String(item.attended), 370, yPosition, { width: 70, align: 'center' });
    doc.text(`${item.percentage}%`, 440, yPosition, { width: 80, align: 'center' });

    yPosition += 20;
  }

  doc.end();

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'REPORT_EXPORT_PDF',
    targetType: 'Course',
    targetId: course._id,
    result: 'success',
    metadata: {
      courseCode: course.code,
      totalSessions,
      studentsCount: stats.length,
    },
  });
};

module.exports = {
  getCourseStats,
  exportCSV,
  exportPDF,
};
