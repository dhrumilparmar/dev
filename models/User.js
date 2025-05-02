const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tools: [{ type: String, default: [] }],
    enrolledCourses: [{ 
        courseName: String,
        enrollmentDate: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('User', userSchema);