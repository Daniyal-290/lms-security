const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

exports.getAssignments = async (req, res) => {
  try {
    let courses;

    if (req.user.role === 'student') {
      courses = await Course.find({ enrolledStudents: req.user.id }).select('_id');
    } else if (req.user.role === 'teacher') {
      courses = await Course.find({ teacher: req.user.id }).select('_id');
    }

    const courseIds = courses.map(c => c._id);
    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title teacher');

    res.json({ success: true, count: assignments.length, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (req.user.role === 'student') {
      const course = await Course.findById(assignment.course._id);
      if (!course.enrolledStudents.includes(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
      }
    }

    if (req.user.role === 'teacher') {
      if (assignment.course.teacher.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Can only view assignments from your courses' });
      }
    }

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, dueDate, maxScore } = req.body;

    if (!title || !description || !courseId || !dueDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, description, courseId, and dueDate are required' 
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only create assignments for your courses' });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course: courseId,
      dueDate,
      maxScore: maxScore || 100
    });

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only update assignments from your courses' });
    }

    const { title, description, dueDate, maxScore } = req.body;
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = dueDate;
    if (maxScore !== undefined) assignment.maxScore = maxScore;

    await assignment.save();
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};