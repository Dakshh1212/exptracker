const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: v => v !== 0,
      message: 'Amount cannot be zero.'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, "Invalid email"]
  }
}, { timestamps: true });

transactionSchema.index({ user: 1 });

module.exports = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
