const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  text: String,
  amount: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
