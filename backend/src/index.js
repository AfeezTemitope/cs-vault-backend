const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/lecturer', require('./routes/lecturer.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/projects/:projectId/comments', require('./routes/comment.routes'));

// Health check
app.get('/', (req, res) => res.json({ status: 'CS-Vault API running ✅' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CS-Vault backend running on port ${PORT}`));
