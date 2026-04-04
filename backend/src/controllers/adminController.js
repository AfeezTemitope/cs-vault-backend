const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { sendWelcomeEmail } = require('../services/emailService');
const generatePassword = require('../utils/generatePassword');

const createLecturer = async (req, res) => {
  const { full_name, email, matric_number, department } = req.body;
  if (!full_name || !email || !matric_number)
    return res.status(400).json({ error: 'full_name, email, matric_number are required' });

  // Check if already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('matric_number', matric_number.trim().toUpperCase())
    .single();

  if (existing) return res.status(400).json({ error: 'A user with this matric number already exists' });

  const password = generatePassword();
  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase.from('users').insert({
    id: uuidv4(),
    full_name,
    email,
    matric_number: matric_number.trim().toUpperCase(),
    password_hash: hash,
    role: 'lecturer',
    department: department || 'Computer Science',
    must_change_password: true
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });

  // Non-blocking email — never fails the request
  sendWelcomeEmail({ email, fullName: full_name, matricNumber: matric_number, password, role: 'lecturer' });

  res.status(201).json({
    message: 'Lecturer created successfully',
    user: { id: data.id, full_name, email, matric_number }
  });
};

const getLecturers = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, matric_number, department, created_at')
    .eq('role', 'lecturer')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const createCourse = async (req, res) => {
  const { title, course_code, description, session } = req.body;
  if (!title || !course_code)
    return res.status(400).json({ error: 'title and course_code required' });

  const { data, error } = await supabase.from('courses').insert({
    id: uuidv4(),
    title,
    course_code: course_code.trim().toUpperCase(),
    description,
    session: session || '2024/2025'
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

const getCourses = async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*, users(full_name)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const assignLecturerToCourse = async (req, res) => {
  const { course_id, lecturer_id } = req.body;
  const { error } = await supabase
    .from('courses')
    .update({ lecturer_id })
    .eq('id', course_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Lecturer assigned to course' });
};

const getAllStudents = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, matric_number, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

module.exports = { createLecturer, getLecturers, createCourse, getCourses, assignLecturerToCourse, getAllStudents };