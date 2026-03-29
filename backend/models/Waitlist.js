const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    boardingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Boarding', 
        required: true 
    },
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // We can track if they have been notified yet
    notified: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);