const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { sendWelcomeEmail } = require('../services/emailService');
const generatePassword = require('../utils/generatePassword');

const createLecturer = async (req, res) => {
  const { full_name, email, matric_number, department } = req.body;
  if (!full_name || !email || !matric_number)
    return res.status(400).json({ error: 'full_name, email, matric_number are required' });

  const { data: existing } = await supabase.from('users').select('id').eq('matric_number', matric_number.trim().toUpperCase()).single();
  if (existing) return res.status(400).json({ error: 'A user with this ID already exists' });

  const password = generatePassword();
  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase.from('users').insert({
    id: uuidv4(), full_name, email,
    matric_number: matric_number.trim().toUpperCase(),
    password_hash: hash, role: 'lecturer',
    department: department || 'Computer Science',
    must_change_password: true
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  sendWelcomeEmail({ email, fullName: full_name, matricNumber: matric_number, password, role: 'lecturer' });
  res.status(201).json({ message: 'Lecturer created', user: { id: data.id, full_name, email, matric_number } });
};

const updateLecturer = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, department } = req.body;
  const { error } = await supabase.from('users').update({ full_name, email, department }).eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Lecturer updated' });
};

const deleteLecturer = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('users').delete().eq('id', id).eq('role', 'lecturer');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Lecturer removed' });
};

const getLecturers = async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id, full_name, email, matric_number, department, created_at')
    .eq('role', 'lecturer').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const createCourse = async (req, res) => {
  const { title, course_code, description, session } = req.body;
  if (!title || !course_code) return res.status(400).json({ error: 'title and course_code required' });
  const { data, error } = await supabase.from('courses').insert({
    id: uuidv4(), title, course_code: course_code.trim().toUpperCase(), description, session: session || '2024/2025'
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

const getCourses = async (req, res) => {
  const { data, error } = await supabase.from('courses').select('*, users(full_name)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const deleteCourse = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Course deleted' });
};

const assignLecturerToCourse = async (req, res) => {
  const { course_id, lecturer_id } = req.body;
  const { error } = await supabase.from('courses').update({ lecturer_id: lecturer_id || null }).eq('id', course_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: lecturer_id ? 'Lecturer assigned' : 'Lecturer removed from course' });
};

const registerStudent = async (req, res) => {
  const { full_name, email, matric_number, course_ids = [] } = req.body;
  if (!full_name || !email || !matric_number)
    return res.status(400).json({ error: 'full_name, email, matric_number are required' });

  const { data: existing } = await supabase.from('users').select('id').eq('matric_number', matric_number.trim().toUpperCase()).single();
  if (existing) return res.status(400).json({ error: 'Student with this matric number already exists' });

  const password = generatePassword();
  const hash = await bcrypt.hash(password, 10);

  const { data: student, error } = await supabase.from('users').insert({
    id: uuidv4(), full_name, email,
    matric_number: matric_number.trim().toUpperCase(),
    password_hash: hash, role: 'student', must_change_password: true
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });

  // Enroll in selected courses
  for (const course_id of course_ids) {
    await supabase.from('enrollments').upsert({ id: uuidv4(), student_id: student.id, course_id }, { onConflict: 'student_id,course_id' });
  }

  sendWelcomeEmail({ email, fullName: full_name, matricNumber: matric_number, password, role: 'student' });
  res.status(201).json({ message: 'Student registered successfully' });
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { full_name, email } = req.body;
  const { error } = await supabase.from('users').update({ full_name, email }).eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Student updated' });
};

const updateStudentCourses = async (req, res) => {
  const { id } = req.params;
  const { course_ids = [] } = req.body;

  // Remove all existing enrollments
  await supabase.from('enrollments').delete().eq('student_id', id);

  // Re-enroll in selected courses
  for (const course_id of course_ids) {
    await supabase.from('enrollments').insert({ id: uuidv4(), student_id: id, course_id });
  }

  res.json({ message: 'Courses updated' });
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('users').delete().eq('id', id).eq('role', 'student');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Student removed' });
};

const getAllStudents = async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id, full_name, email, matric_number, created_at')
    .eq('role', 'student').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const getAllEnrollments = async (req, res) => {
  const { data, error } = await supabase.from('enrollments').select('student_id, course_id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

module.exports = {
  createLecturer, updateLecturer, deleteLecturer, getLecturers,
  createCourse, getCourses, deleteCourse, assignLecturerToCourse,
  registerStudent, updateStudent, updateStudentCourses, deleteStudent, getAllStudents,
  getAllEnrollments
};
