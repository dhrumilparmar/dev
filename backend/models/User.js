const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    tools: [String],
    enrolledCourses: [{ courseName: String }]
});

module.exports = mongoose.model('User', userSchema);