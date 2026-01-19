const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  phoneNumber: String,
  amount: Number,
  accountReference: String,
  transactionDesc: String,
  status: { type: String, default: 'pending' },
  mpesaReceiptNumber: String,
  checkoutRequestId: String,
  merchantRequestId: String,
  responseDescription: String,
  customerMessage: String,
  provider: String,
  environment: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  failureReason: String
});

transactionSchema.index({ checkoutRequestId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
