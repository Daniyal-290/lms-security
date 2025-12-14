const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const courseController = require('../controllers/courseController');

router.use(auth);

router.get('/', rbac('course', 'view'), courseController.getCourses);
router.get('/:id', rbac('course', 'view'), courseController.getCourse);
router.post('/', rbac('course', 'create'), courseController.createCourse);
router.put('/:id', rbac('course', 'update'), courseController.updateCourse);
router.post('/:id/enroll', rbac('course', 'enroll'), courseController.enrollInCourse);
router.post('/:id/students', rbac('course', 'manage_students'), courseController.addStudent);
router.delete('/:id/students/:studentId', rbac('course', 'manage_students'), courseController.removeStudent);

module.exports = router;