const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Loan || mongoose.model("Loan", loanSchema);
