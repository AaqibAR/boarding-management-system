const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Boarding = require('../models/Boarding');
const Waitlist = require('../models/Waitlist'); // 👈 Imported the Waitlist model

// --- 1. Multer Setup for Image Uploads ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// --- 2. AI Description Generator Route (Your Unique Feature!) ---
router.post('/generate-description', async (req, res) => {
    try {
        const { features } = req.body; 
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Write a short, engaging, and professional real estate description for a student boarding place with the following features: ${features}. Keep it under 2 paragraphs and highlight its appeal to university students.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ description: text });
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ message: "Failed to generate description" });
    }
});

// --- 3. Add New Boarding (with images) ---
router.post('/add', upload.array('images', 5), async (req, res) => {
    try {
        const { ownerId, title, description, price, location, genderAllowed, facilities } = req.body;
        
        const imagePaths = req.files ? req.files.map(file => file.path) : [];

        const newBoarding = new Boarding({
            ownerId,
            title,
            description,
            price,
            location,
            genderAllowed,
            facilities: facilities ? facilities.split(',') : [], 
            images: imagePaths
        });

        await newBoarding.save();
        res.status(201).json({ message: "Boarding added successfully!", boarding: newBoarding });
    } catch (error) {
        console.error("Error adding boarding:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// --- 4. Get All Boardings ---
router.get('/', async (req, res) => {
    try {
        const boardings = await Boarding.find();
        res.status(200).json(boardings);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// --- 5. Update Boarding Status & Smart Waitlist Trigger ---
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // Must be 'Available' or 'Full'
        const boardingId = req.params.id;

        const boarding = await Boarding.findByIdAndUpdate(
            boardingId, 
            { status }, 
            { new: true }
        );
        
        if (!boarding) return res.status(404).json({ message: "Boarding not found" });

        let notifiedStudents = [];

        // 🚨 SMART WAITLIST TRIGGER 🚨
        if (status === 'Available') {
            const waitingList = await Waitlist.find({ boardingId: boardingId, notified: false });

            if (waitingList.length > 0) {
                console.log(`\n🔔 ALERT: Boarding ${boardingId} is available!`);

                for (let entry of waitingList) {
                    console.log(`✉️ Sending email to Student ID: ${entry.studentId}`);
                    notifiedStudents.push(entry.studentId);

                    entry.notified = true;
                    await entry.save();
                }
                console.log(`✅ Successfully notified ${notifiedStudents.length} students.\n`);
            }
        }

        res.status(200).json({ 
            message: `Status updated to ${status}`, 
            notificationsSent: notifiedStudents.length,
            boarding 
        });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// --- 6. Join the Waitlist (For Students) ---
router.post('/:id/waitlist', async (req, res) => {
    try {
        const { studentId } = req.body; 
        const boardingId = req.params.id;

        const existingEntry = await Waitlist.findOne({ boardingId, studentId });
        if (existingEntry) {
             return res.status(400).json({ message: "You are already on the waitlist!" });
        }

        const newWaitlist = new Waitlist({ boardingId, studentId });
        await newWaitlist.save();

        res.status(201).json({ message: "Successfully added to the waitlist!" });
    } catch (error) {
        console.error("Waitlist Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;