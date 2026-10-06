require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const { initializeDatabase } = require('./config/initDb');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const reassignmentRoutes = require('./routes/reassignmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Faculty Leave Management API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/reassignments', reassignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot start server: Database connection failed');
    console.error('Please ensure MySQL is running and credentials in .env are correct');
    process.exit(1);
  }

  try {
    await initializeDatabase();
  } catch (err) {
    console.error('Database initialization failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 API Docs: http://localhost:${PORT}/api/health`);
    console.log(`\nDemo Credentials:`);
    console.log(`  Admin:   admin@college.edu / Password@123`);
    console.log(`  HOD:     hod.cs@college.edu / Password@123`);
    console.log(`  Faculty: amit.sharma@college.edu / Password@123\n`);
  });
};

startServer();
