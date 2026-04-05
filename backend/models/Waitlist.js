const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    boardingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Boarding', 
        required: true 
    },
    // Using Name and Email since students aren't logging in yet
    studentName: { 
        type: String, 
        required: true 
    },
    studentEmail: { 
        type: String, 
        required: true 
    },
    // We can track if they have been notified yet (Great addition!)
    notified: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true }); // timestamps automatically gives us 'createdAt' (when they joined) and 'updatedAt'

module.exports = mongoose.model('Waitlist', waitlistSchema);