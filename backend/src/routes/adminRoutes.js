const express = require('express');
const router = express.Router();
const {
  getAllFaculty, getFacultyById, createFaculty, updateFaculty, resetPassword, updateFacultySubjects,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getSubjects, createSubject, updateSubject, deleteSubject
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Faculty management (admin only)
router.get('/faculty', authorize('admin','hod'), getAllFaculty);
router.get('/faculty/:id', authorize('admin','hod'), getFacultyById);
router.post('/faculty', authorize('admin'), createFaculty);
router.put('/faculty/:id', authorize('admin'), updateFaculty);
router.put('/faculty/:id/reset-password', authorize('admin'), resetPassword);
router.put('/faculty/:id/subjects', authorize('admin'), updateFacultySubjects);

// Department management
router.get('/departments', getDepartments);
router.post('/departments', authorize('admin'), createDepartment);
router.put('/departments/:id', authorize('admin'), updateDepartment);
router.delete('/departments/:id', authorize('admin'), deleteDepartment);

// Subject management
router.get('/subjects', getSubjects);
router.post('/subjects', authorize('admin'), createSubject);
router.put('/subjects/:id', authorize('admin'), updateSubject);
router.delete('/subjects/:id', authorize('admin'), deleteSubject);

module.exports = router;
