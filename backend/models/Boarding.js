const mongoose = require('mongoose');

const boardingSchema = new mongoose.Schema({
    // Thanish handles users, so we just link the Owner's ID here
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    
    // Naweedh needs these for his filtering system!
    genderAllowed: { type: String, enum: ['Male', 'Female', 'Any'], required: true },
    facilities: [{ type: String }], // e.g., ["AC", "WiFi", "Attached Bath"]
    
    // You are handling image uploads
    images: [{ type: String }], // Array of file paths/URLs
    
    // Your availability management feature
    status: { 
        type: String, 
        enum: ['Available', 'Full'], 
        default: 'Available' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Boarding', boardingSchema);