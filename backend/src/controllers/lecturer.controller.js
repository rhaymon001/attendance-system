const Course = require('../models/Course');
const Venue = require('../models/Venue');

const getCourses = async (req, res) => {
  const courses = await Course.find({ lecturerId: req.user._id })
    .populate('lecturerId', 'name email department')
    .populate('enrolledStudents', 'name matricNo')
    .sort({ code: 1 });
  return res.status(200).json(courses);
};

const getVenues = async (req, res) => {
  const venues = await Venue.find().sort({ name: 1 });
  return res.status(200).json(venues);
};

module.exports = { getCourses, getVenues };
