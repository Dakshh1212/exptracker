const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

// Export the model. If it exists already, reuse it.
module.exports = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
