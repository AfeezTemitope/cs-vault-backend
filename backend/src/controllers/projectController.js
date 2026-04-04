const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

const uploadProject = async (req, res) => {
  const { title, description, course_id, session, github_link } = req.body;
  const studentId = req.user.id;

  if (!title || !course_id || !session)
    return res.status(400).json({ error: 'title, course_id, session are required' });

  let pdf_url = null;
  let zip_url = null;

  // Upload files to Supabase Storage
  for (const file of req.files || []) {
    const ext = file.mimetype === 'application/pdf' ? 'pdf' : 'zip';
    const path = `projects/${uuidv4()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('cs-vault')
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('cs-vault').getPublicUrl(path);
    if (ext === 'pdf') pdf_url = publicUrl;
    else zip_url = publicUrl;
  }

  const { data, error } = await supabase.from('projects').insert({
    id: uuidv4(),
    title,
    description,
    course_id,
    student_id: studentId,
    session,
    github_link: github_link || null,
    pdf_url,
    zip_url
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

const getProject = async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabase
    .from('projects')
    .select('*, users(full_name, matric_number, email), courses(title, course_code), grades(grade, users(full_name)), comments(*, users(full_name, role))')
    .eq('id', projectId)
    .single();

  if (error) return res.status(404).json({ error: 'Project not found' });
  res.json(data);
};

const getStudentProjects = async (req, res) => {
  const studentId = req.user.id;
  const { course_id, session } = req.query;

  // Get enrolled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId);

  const courseIds = enrollments?.map(e => e.course_id) || [];

  let query = supabase
    .from('projects')
    .select('*, users(full_name, matric_number), courses(title, course_code), grades(grade)')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });

  if (course_id) query = query.eq('course_id', course_id);
  if (session) query = query.eq('session', session);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const searchProjects = async (req, res) => {
  const { q } = req.query;
  const studentId = req.user.id;

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId);

  const courseIds = enrollments?.map(e => e.course_id) || [];

  const { data, error } = await supabase
    .from('projects')
    .select('*, users(full_name, matric_number), courses(title, course_code)')
    .in('course_id', courseIds)
    .ilike('title', `%${q}%`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

module.exports = { uploadProject, getProject, getStudentProjects, searchProjects };
