const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    nickname: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subject: { type: String, required: true },
    score: { type: Number, default: 0 },
    profilePicture: { type: String } // Base64-codiertes Bild
});
module.exports = mongoose.model('User', userSchema);