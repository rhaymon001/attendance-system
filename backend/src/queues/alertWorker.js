const alertQueue = require('./alertQueue');
const sendEmail = require('../utils/sendEmail');

/**
 * startAlertWorker
 * ----------------
 * Bull worker: processes absenteeism jobs from 'absenteeism-alerts' queue.
 * Sends email alert to lecturer when a student's attendance drops below threshold.
 */
const startAlertWorker = () => {
  alertQueue.process(async (job) => {
    const {
      studentEmail,
      studentName,
      courseName,
      courseCode,
      percentage,
      threshold,
      lecturerEmail,
    } = job.data;

    if (!lecturerEmail) {
      console.warn(`[AlertWorker] Job ${job.id}: No lecturer email specified, skipping.`);
      return;
    }

    const subject = `Absenteeism Alert: ${studentName} - ${courseCode || courseName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #d9534f;">Absenteeism Alert</h2>
        <p>Dear Lecturer,</p>
        <p>This is an automated notification that student <strong>${studentName}</strong> (${studentEmail || 'N/A'}) has an attendance rate of <strong>${percentage}%</strong> in <strong>${courseName} (${courseCode || ''})</strong>.</p>
        <p>This is below the required attendance threshold of <strong>${threshold}%</strong>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Habiba Attendance Management System</p>
      </div>
    `;

    await sendEmail({
      to: lecturerEmail,
      subject,
      html,
    });

    console.log(`[AlertWorker] Alert email sent to ${lecturerEmail} for student ${studentName}`);
  });

  alertQueue.on('failed', (job, err) => {
    console.error(`[AlertWorker] Job ${job.id} failed with error: ${err.message}`);
  });

  console.log('[AlertWorker] Absenteeism alert worker registered and listening');
};

module.exports = startAlertWorker;
