const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the User schema
        required: true, // Every driver must have a corresponding user
    },
    name: { type: String, required: true },
    idCard: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    vehicle: {
        make: { type: String, required: true }, // e.g., Tesla
        model: { type: String, required: true }, // e.g., Model X
        licensePlate: { type: String, required: true, unique: true },
    },
    availability: {
        type: String,
        enum: ['available', 'unavailable'],
        default: 'available',
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 5, // Default rating for new drivers
    },
    location: {
        latitude: { type: Number,default:0 },
        longitude: { type: Number,default:0},
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Driver', driverSchema);
