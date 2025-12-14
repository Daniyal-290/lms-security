const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const assignmentController = require('../controllers/assignmentController');

router.use(auth);

router.get('/', rbac('assignment', 'view'), assignmentController.getAssignments);
router.get('/:id', rbac('assignment', 'view'), assignmentController.getAssignment);
router.post('/', rbac('assignment', 'create'), assignmentController.createAssignment);
router.put('/:id', rbac('assignment', 'update'), assignmentController.updateAssignment);

module.exports = router;