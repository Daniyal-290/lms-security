

const Course = require('../models/Course');

exports.getCourses = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query = { enrolledStudents: req.user.id };
    } else if (req.user.role === 'teacher') {
      query = { teacher: req.user.id };as
    }

    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .populate('enrolledStudents', 'name email');

    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('enrolledStudents', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role === 'student') {
      const isEnrolled = course.enrolledStudents.some(
        s => s._id.toString() === req.user.id
      );
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
      }
    }

    if (req.user.role === 'teacher' && course.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only view your own courses' });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, content } = req.body;
    const course = await Course.create({
      title,
      description,
      content,
      teacher: req.user.id
    });

    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only update your own courses' });
    }

    const { title, description, content } = req.body;
    course.title = title || course.title;
    course.description = description || course.description;
    course.content = content || course.content;

    await course.save();
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    course.enrolledStudents.push(req.user.id);
    await course.save();

    res.json({ success: true, message: 'Enrolled successfully', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only manage your own courses' });
    }

    const { studentId } = req.body;

    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student already enrolled' });
    }

    course.enrolledStudents.push(studentId);
    await course.save();

    res.json({ success: true, message: 'Student added', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only manage your own courses' });
    }

    course.enrolledStudents = course.enrolledStudents.filter(
      id => id.toString() !== req.params.studentId
    );
    
    await course.save();
    res.json({ success: true, message: 'Student removed', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

