const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, content } = req.body;

    if (!assignmentId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assignment ID and content are required' 
      });
    }

    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const course = await Course.findById(assignment.course._id);
    if (!course.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user.id
    });

    if (existingSubmission) {
      return res.status(400).json({ success: false, message: 'Already submitted' });
    }

    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user.id,
      content
    });

    res.status(201).json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('assignment', 'title dueDate maxScore')
      .populate('gradedBy', 'name email');

    res.json({ success: true, count: submissions.length, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).populate('course');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only view submissions from your courses' });
    }

    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email')
      .populate('gradedBy', 'name email');

    res.json({ success: true, count: submissions.length, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ success: false, message: 'Grade is required' });
    }

    if (grade < 0 || grade > 100) {
      return res.status(400).json({ success: false, message: 'Grade must be between 0 and 100' });
    }

    const submission = await Submission.findById(req.params.id)
      .populate({
        path: 'assignment',
        populate: { path: 'course' }
      });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.assignment.course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only grade submissions from your courses' });
    }

    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.gradedBy = req.user.id;

    await submission.save();
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyGrades = async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      student: req.user.id,
      grade: { $ne: null }
    })
      .populate('assignment', 'title maxScore')
      .populate('gradedBy', 'name email');

    res.json({ success: true, count: submissions.length, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};