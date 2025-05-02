require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));
app.use(express.json());

// Updated MongoDB connection with options
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.log("Failed to connect to MongoDB");
    console.error(err);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/tools', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/tools.html'));
});

app.get('/courses', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/courses.html'));
});

app.get('/roadmaps', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/roadmaps.html')); 
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/signup.html')); 
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/login.html')); 
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/dashboard.html'));
});

app.post('/signup', async (req, res) => {
    try {
        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB not connected');
            return res.status(500).json({ message: 'Database connection error' });
        }

        const { name, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email }).maxTimeMS(5000);
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ name, email, password });
        await user.save();
        
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: 'Error creating user',
            error: error.message 
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        
        // Check if user exists and password matches
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Login successful
        res.status(200).json({ 
            message: 'Login successful',
            user: {
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

app.post('/add-tool', async (req, res) => {
    try {
        const { email, tool } = req.body;
        
        // Validate tool name
        if (!tool || tool.trim() === '') {
            return res.status(400).json({ message: 'Tool name cannot be empty' });
        }

        // Find user and update their tools array
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if tool is already in use
        if (user.tools.includes(tool)) {
            return res.status(400).json({ 
                message: 'You are already using this tool',
                isUsing: true 
            });
        }

        // Add new tool
        user.tools.push(tool);
        await user.save();

        // Filter out empty tools before sending response
        const validTools = user.tools.filter(t => t && t.trim() !== '');

        res.status(200).json({ 
            message: 'Tool added successfully',
            isUsing: false,
            tools: validTools
        });
    } catch (error) {
        console.error('Error adding tool:', error);
        res.status(500).json({ message: 'Error adding tool' });
    }
});

app.post('/enroll-course', async (req, res) => {
    try {
        const { email, courseName } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already enrolled
        const isEnrolled = user.enrolledCourses.some(course => 
            course.courseName === courseName
        );

        if (isEnrolled) {
            return res.status(400).json({ 
                message: 'You are already enrolled in this course',
                isEnrolled: true
            });
        }

        // Add new course enrollment
        user.enrolledCourses.push({ courseName });
        await user.save();

        res.status(200).json({ 
            message: 'Successfully enrolled in course',
            isEnrolled: false
        });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ message: 'Error enrolling in course' });
    }
});

app.post('/api/user-data', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get tools and courses with their full details
        const userData = {
            name: user.name,
            email: user.email,
            tools: user.tools || [],
            enrolledCourses: user.enrolledCourses || []
        };

        res.status(200).json(userData);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});

