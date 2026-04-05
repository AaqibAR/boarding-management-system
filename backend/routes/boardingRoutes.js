const fs = require('fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Boarding = require('../models/Boarding');
const Waitlist = require('../models/Waitlist');

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

// --- 2. AI Description Generator Route ---
router.post('/generate-description', async (req, res) => {
    try {
        const { features } = req.body; 
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // The modern, lightning-fast model for text
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

// --- 2.5 AI Image Verification & Auto-Tagging ---
router.post('/verify-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No image uploaded for verification" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // The exact same model now handles Vision automatically!
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Convert the image into a Base64 string that Gemini can "see"
        const imagePath = req.file.path;
        const mimeType = req.file.mimetype;
        const imagePart = {
            inlineData: {
                data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
                mimeType
            }
        };

        const prompt = `Analyze this image. Is it a legitimate interior of a room, house, or boarding place? What furniture or amenities are visible? 
        Respond STRICTLY in JSON format with no markdown formatting or extra text. Example:
        {
            "isLegitimate": true,
            "tags": ["Bed", "Ceiling Fan", "Desk", "Window"]
        }`;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // Clean up the JSON string in case Gemini adds markdown like ```json
        const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const verificationData = JSON.parse(cleanJsonString);

        // Delete the temporary file from the server since we only needed it for the AI scan
        fs.unlinkSync(imagePath);

        res.status(200).json(verificationData);
    } catch (error) {
        console.error("AI Image Scan Error:", error);
        res.status(500).json({ message: "Failed to scan image" });
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
                    console.log(`✉️ Sending email to: ${entry.studentName} (${entry.studentEmail})`);
                    notifiedStudents.push(entry.studentEmail);

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
        const { studentName, studentEmail } = req.body; 
        const boardingId = req.params.id;

        const existingEntry = await Waitlist.findOne({ boardingId, studentEmail });
        if (existingEntry) {
             return res.status(400).json({ message: "You are already on the waitlist!" });
        }

        const newWaitlist = new Waitlist({ boardingId, studentName, studentEmail });
        await newWaitlist.save();

        res.status(201).json({ message: "Successfully added to the waitlist!" });
    } catch (error) {
        console.error("Waitlist Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// --- 7. Get Waitlist for a specific boarding (Owner Action) ---
router.get('/:id/waitlist', async (req, res) => {
  try {
    const list = await Waitlist.find({ boardingId: req.params.id }).sort({ createdAt: 1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching waitlist" });
  }
});

// --- 8. DELETE a boarding listing ---
router.delete('/:id', async (req, res) => {
  try {
    const deletedBoarding = await Boarding.findByIdAndDelete(req.params.id);
    if (!deletedBoarding) {
      return res.status(404).json({ message: "Boarding not found" });
    }
    res.json({ message: "Boarding deleted successfully!" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server error while deleting" });
  }
});

// --- 9. UPDATE a boarding listing ---
router.put('/:id', async (req, res) => {
  try {
    const updatedBoarding = await Boarding.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    );
    
    if (!updatedBoarding) {
      return res.status(404).json({ message: "Boarding not found" });
    }
    res.json(updatedBoarding);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server error while updating" });
  }
});

module.exports = router;