const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{text: { type: String, required: true }, isCorrect: { type: Boolean, required: true }}],
    category: { type: String, required: true }
    //createdBy: { type: String, required: true }
});
module.exports = mongoose.model('Question', questionSchema);