const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

const addComment = async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment content is required' });

  const { data, error } = await supabase.from('comments').insert({
    id: uuidv4(),
    project_id: projectId,
    user_id: req.user.id,
    content
  }).select('*, users(full_name, role)').single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

const getComments = async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabase
    .from('comments')
    .select('*, users(full_name, role)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Comment deleted' });
};

module.exports = { addComment, getComments, deleteComment };
