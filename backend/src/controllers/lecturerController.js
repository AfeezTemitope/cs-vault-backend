const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { sendWelcomeEmail } = require('../services/emailService');
const generatePassword = require('../utils/generatePassword');

const getMyCourses = async (req, res) => {
  const { data, error } = await supabase
    .from('courses').select('*')
    .eq('lecturer_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const getCourseDetails = async (req, res) => {
  const { courseId } = req.params;
  const { data: course } = await supabase
    .from('courses').select('*').eq('id', courseId).single();
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, users(id, full_name, email, matric_number)')
    .eq('course_id', courseId);
  const { data: projects } = await supabase
    .from('projects')
    .select('*, users(full_name, matric_number)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  res.json({ course, students: enrollments?.map(e => e.users), projects });
};

const registerStudent = async (req, res) => {
  const { full_name, email, matric_number, course_ids = [] } = req.body;
  if (!full_name || !email || !matric_number)
    return res.status(400).json({ error: 'All fields required' });

  let { data: existing } = await supabase
    .from('users').select('*')
    .eq('matric_number', matric_number.trim().toUpperCase())
    .single();

  let studentId;

  if (!existing) {
    const password = generatePassword();
    const hash = await bcrypt.hash(password, 10);
    const { data: newStudent, error } = await supabase.from('users').insert({
      id: uuidv4(), full_name, email,
      matric_number: matric_number.trim().toUpperCase(),
      password_hash: hash, role: 'student', must_change_password: true
    }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    studentId = newStudent.id;
    sendWelcomeEmail({ email, fullName: full_name, matricNumber: matric_number, password, role: 'student' });
  } else {
    studentId = existing.id;
  }

  for (const course_id of course_ids) {
    await supabase.from('enrollments').upsert(
      { id: uuidv4(), student_id: studentId, course_id },
      { onConflict: 'student_id,course_id' }
    );
  }

  res.status(201).json({ message: 'Student registered and enrolled successfully' });
};

const gradeProject = async (req, res) => {
  const { projectId } = req.params;
  const { grade } = req.body;
  const validGrades = ['A', 'B', 'C', 'D', 'E', 'F'];
  if (!validGrades.includes(grade))
    return res.status(400).json({ error: 'Grade must be A, B, C, D, E or F' });

  const { data, error } = await supabase.from('grades').upsert({
    id: uuidv4(), project_id: projectId,
    lecturer_id: req.user.id, grade
  }, { onConflict: 'project_id' }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

const getAllProjects = async (req, res) => {
  const { course_id, session, search } = req.query;
  let query = supabase
    .from('projects')
    .select('*, users(full_name, matric_number), courses(title, course_code), grades(grade)')
    .order('created_at', { ascending: false });

  if (course_id) query = query.eq('course_id', course_id);
  if (session) query = query.eq('session', session);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

module.exports = { getMyCourses, getCourseDetails, registerStudent, gradeProject, getAllProjects };