const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, "Loan amount cannot be negative"]
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0,
    min: [0, "Paid amount cannot be negative"],
    validate: {
      validator: function(v) {
        return v <= this.amount;
      },
      message: "Paid amount cannot exceed loan amount"
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

loanSchema.index({ user: 1 });

module.exports = mongoose.models.Loan || mongoose.model("Loan", loanSchema);
