const { pool } = require('../config/database');
const moment = require('moment');
const { createNotification } = require('./notificationService');

/**
 * Core Dynamic Lecture Rescheduling Engine
 * Priority: subject expertise → availability → lowest workload → same department → avoid repetition
 */
const runReschedulingEngine = async (leaveRequestId, facultyId, startDate, endDate, hodId) => {
  const reassignments = [];

  try {
    const start = moment(startDate);
    const end = moment(endDate);
    const leaveDates = [];
    let current = start.clone();
    while (current.isSameOrBefore(end)) {
      leaveDates.push(current.clone());
      current.add(1, 'day');
    }

    for (const date of leaveDates) {
      const dayOfWeek = date.format('dddd'); // e.g. "Monday"
      // Find all timetable slots for this faculty on this day
      const [affectedSlots] = await pool.execute(
        `SELECT t.*, s.name AS subject_name, d.name AS dept_name
         FROM timetable t
         JOIN subjects s ON t.subject_id = s.id
         JOIN departments d ON t.department_id = d.id
         WHERE t.faculty_id = ? AND t.day_of_week = ? AND t.is_active = 1`,
        [facultyId, dayOfWeek]
      );

      for (const slot of affectedSlots) {
        const substitute = await findBestSubstitute(slot, facultyId, date.format('YYYY-MM-DD'), leaveRequestId);

        const reassignmentDate = date.format('YYYY-MM-DD');
        const [result] = await pool.execute(
          `INSERT INTO lecture_reassignments
           (leave_request_id, timetable_id, original_faculty_id, substitute_faculty_id, subject_id,
            reassignment_date, day_of_week, start_time, end_time, room_number, status, assignment_method)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            leaveRequestId, slot.id, facultyId,
            substitute ? substitute.id : null,
            slot.subject_id, reassignmentDate, dayOfWeek,
            slot.start_time, slot.end_time, slot.room_number,
            substitute ? 'assigned' : 'pending',
            'auto'
          ]
        );

        if (substitute) {
          // Update workload log
          await updateWorkloadLog(substitute.id, date.month() + 1, date.year());

          // Notify substitute
          await createNotification(
            substitute.id,
            'Substitution Duty Assigned',
            `You have been assigned to cover ${slot.subject_name} on ${reassignmentDate} from ${slot.start_time} to ${slot.end_time} in room ${slot.room_number}.`,
            'substitution_assigned', result.insertId, 'lecture_reassignment'
          );

          // Notify HOD
          await createNotification(
            hodId,
            'Lecture Reassigned',
            `${slot.subject_name} on ${reassignmentDate} (${slot.start_time}-${slot.end_time}) has been auto-assigned to ${substitute.name}.`,
            'lecture_reassigned', result.insertId, 'lecture_reassignment'
          );

          reassignments.push({
            id: result.insertId,
            date: reassignmentDate,
            day: dayOfWeek,
            subject: slot.subject_name,
            time: `${slot.start_time} - ${slot.end_time}`,
            room: slot.room_number,
            substitute: substitute.name,
            method: 'auto'
          });
        } else {
          reassignments.push({
            id: result.insertId,
            date: reassignmentDate,
            day: dayOfWeek,
            subject: slot.subject_name,
            time: `${slot.start_time} - ${slot.end_time}`,
            room: slot.room_number,
            substitute: null,
            method: 'auto',
            note: 'No suitable substitute found. Manual assignment required.'
          });
        }
      }
    }

    return reassignments;
  } catch (error) {
    console.error('Rescheduling engine error:', error.message);
    throw error;
  }
};

/**
 * Find the best substitute using priority scoring
 */
const findBestSubstitute = async (slot, originalFacultyId, dateStr, leaveRequestId) => {
  try {
    // Get all active faculty except the one on leave
    const [candidates] = await pool.execute(
      `SELECT u.id, u.name, u.department_id,
              COALESCE(wl.substitution_count, 0) AS substitution_count,
              COALESCE(wl.max_allowed_substitutions, 10) AS max_allowed
       FROM users u
       LEFT JOIN workload_logs wl ON u.id = wl.faculty_id
         AND wl.month = MONTH(?) AND wl.year = YEAR(?)
       WHERE u.role = 'faculty' AND u.is_active = 1 AND u.id != ?`,
      [dateStr, dateStr, originalFacultyId]
    );

    const scored = [];

    for (const candidate of candidates) {
      // Skip if workload exceeded
      if (candidate.substitution_count >= candidate.max_allowed) continue;

      let score = 0;

      // Priority 1: Can teach the subject (subject expertise)
      const [subjectMatch] = await pool.execute(
        'SELECT id, is_primary FROM faculty_subjects WHERE faculty_id = ? AND subject_id = ?',
        [candidate.id, slot.subject_id]
      );
      if (!subjectMatch.length) continue; // Must know the subject
      score += subjectMatch[0].is_primary ? 40 : 20;

      // Priority 2: No timetable conflict (not already teaching at this time on this day)
      const dayOfWeek = moment(dateStr).format('dddd');
      const [conflicts] = await pool.execute(
        `SELECT id FROM timetable
         WHERE faculty_id = ? AND day_of_week = ? AND is_active = 1
         AND NOT (end_time <= ? OR start_time >= ?)`,
        [candidate.id, dayOfWeek, slot.start_time, slot.end_time]
      );
      if (conflicts.length > 0) continue; // Hard constraint: no conflicts

      // Also check if already assigned as substitute on this date/time
      const [subConflicts] = await pool.execute(
        `SELECT id FROM lecture_reassignments
         WHERE substitute_faculty_id = ? AND reassignment_date = ?
         AND NOT (end_time <= ? OR start_time >= ?) AND status != 'cancelled'`,
        [candidate.id, dateStr, slot.start_time, slot.end_time]
      );
      if (subConflicts.length > 0) continue;

      // Priority 3: Lower workload = higher score
      score += Math.max(0, 30 - candidate.substitution_count * 3);

      // Priority 4: Same department preferred
      if (candidate.department_id === slot.department_id) score += 15;

      // Priority 5: Avoid assigning same faculty repeatedly (check recent assignments)
      const [recentAssign] = await pool.execute(
        `SELECT COUNT(*) as cnt FROM lecture_reassignments
         WHERE substitute_faculty_id = ? AND leave_request_id = ?`,
        [candidate.id, leaveRequestId]
      );
      if (recentAssign[0].cnt > 0) score -= 10;

      scored.push({ ...candidate, score });
    }

    if (!scored.length) return null;

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  } catch (error) {
    console.error('findBestSubstitute error:', error.message);
    return null;
  }
};

/**
 * Update or create workload log for a faculty member
 */
const updateWorkloadLog = async (facultyId, month, year) => {
  await pool.execute(
    `INSERT INTO workload_logs (faculty_id, month, year, substitution_count, regular_lectures, max_allowed_substitutions)
     VALUES (?, ?, ?, 1, 0, 10)
     ON DUPLICATE KEY UPDATE substitution_count = substitution_count + 1`,
    [facultyId, month, year]
  );
};

// PUT /api/reassignments/:id/override - HOD manual override
const manualOverride = async (reassignmentId, substituteId, reason, hodId) => {
  const [rows] = await pool.execute('SELECT * FROM lecture_reassignments WHERE id = ?', [reassignmentId]);
  if (!rows.length) throw new Error('Reassignment not found.');

  const r = rows[0];

  // Check availability
  const [conflicts] = await pool.execute(
    `SELECT id FROM timetable WHERE faculty_id = ? AND day_of_week = ? AND is_active = 1
     AND NOT (end_time <= ? OR start_time >= ?)`,
    [substituteId, r.day_of_week, r.start_time, r.end_time]
  );
  if (conflicts.length) throw new Error('Selected faculty has a timetable conflict at this time.');

  // Remove old substitute from workload if existed
  if (r.substitute_faculty_id) {
    await pool.execute(
      `UPDATE workload_logs SET substitution_count = GREATEST(0, substitution_count - 1)
       WHERE faculty_id = ? AND month = MONTH(?) AND year = YEAR(?)`,
      [r.substitute_faculty_id, r.reassignment_date, r.reassignment_date]
    );
  }

  await pool.execute(
    `UPDATE lecture_reassignments SET substitute_faculty_id = ?, assignment_method = 'manual',
     hod_override_reason = ?, status = 'assigned' WHERE id = ?`,
    [substituteId, reason, reassignmentId]
  );

  await updateWorkloadLog(substituteId, moment(r.reassignment_date).month() + 1, moment(r.reassignment_date).year());

  // Notify new substitute
  const [sub] = await pool.execute('SELECT name FROM users WHERE id = ?', [substituteId]);
  const [subj] = await pool.execute('SELECT name FROM subjects WHERE id = ?', [r.subject_id]);

  await createNotification(substituteId, 'Substitution Duty Assigned',
    `You have been manually assigned to cover ${subj[0]?.name} on ${r.reassignment_date} from ${r.start_time} to ${r.end_time}.`,
    'substitution_assigned', reassignmentId, 'lecture_reassignment');

  return { success: true, substitute: sub[0]?.name };
};

module.exports = { runReschedulingEngine, findBestSubstitute, manualOverride };
