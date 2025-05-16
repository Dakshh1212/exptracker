const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  paidAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Loan", loanSchema);
