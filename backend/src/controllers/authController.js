const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { sendWelcomeEmail } = require('../services/emailService');
const generatePassword = require('../utils/generatePassword');
require('dotenv').config();

const login = async (req, res) => {
  const { matric_number, password } = req.body;
  if (!matric_number || !password)
    return res.status(400).json({ error: 'Matric number and password are required' });

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('matric_number', matric_number.trim().toUpperCase())
    .single();

  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      matric_number: user.matric_number,
      must_change_password: user.must_change_password
    }
  });
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(new_password, 10);
  await supabase
    .from('users')
    .update({ password_hash: hash, must_change_password: false })
    .eq('id', userId);

  res.json({ message: 'Password changed successfully' });
};

const forgotPassword = async (req, res) => {
  const { matric_number } = req.body;
  if (!matric_number)
    return res.status(400).json({ error: 'Matric number is required' });

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('matric_number', matric_number.trim().toUpperCase())
    .single();

  // Always return success even if user not found — prevents account enumeration
  if (!user) {
    return res.json({ message: 'If this account exists, a new password has been sent to the registered email.' });
  }

  const newPassword = generatePassword();
  const hash = await bcrypt.hash(newPassword, 10);

  await supabase
    .from('users')
    .update({ password_hash: hash, must_change_password: true })
    .eq('id', user.id);

  // Send new password via email — non-blocking
  sendWelcomeEmail({
    email: user.email,
    fullName: user.full_name,
    matricNumber: user.matric_number,
    password: newPassword,
    role: user.role,
    isReset: true,
  });

  res.json({ message: 'If this account exists, a new password has been sent to the registered email.' });
};

const getMe = async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, email, role, matric_number, must_change_password')
    .eq('id', req.user.id)
    .single();

  res.json(user);
};

module.exports = { login, changePassword, forgotPassword, getMe };