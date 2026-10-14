const Course = require('../models/Course');
const Session = require('../models/Session');
const AttendanceRecord = require('../models/AttendanceRecord');

const getMyCourses = async (req, res) => {
  const courses = await Course.find({ enrolledStudents: req.user._id })
    .populate('lecturerId', 'name email department')
    .sort({ code: 1 });

  const response = await Promise.all(courses.map(async (course) => {
    const sessions = await Session.find({ courseId: course._id })
      .select('_id startedAt isActive endedAt')
      .sort({ startedAt: -1 });
    const sessionIds = sessions.map(({ _id }) => _id);
    const records = await AttendanceRecord.find({
      studentId: req.user._id,
      sessionId: { $in: sessionIds },
      status: 'present',
    }).sort({ checkedInAt: -1 });
    const attendanceBySession = new Map(records.map((record) => [record.sessionId.toString(), record]));
    const totalSessions = sessions.length;

    return {
      ...course.toObject(),
      totalSessions,
      attended: records.length,
      percentage: totalSessions ? Math.round((records.length / totalSessions) * 100) : 0,
      history: sessions.map((session) => {
        const record = attendanceBySession.get(session._id.toString());
        return {
          _id: record?._id || session._id,
          checkedInAt: record?.checkedInAt || null,
          status: record ? 'present' : 'absent',
          sessionId: session._id,
          date: session.startedAt,
          startedAt: session?.startedAt,
          isActive: session?.isActive,
        };
      }),
    };
  }));

  return res.status(200).json(response);
};

module.exports = { getMyCourses };
