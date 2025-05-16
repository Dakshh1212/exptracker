const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express(); // Express app instance
const PORT = 3001;

// Import Mongoose models
const Transaction = require('./models/Transaction');
const Loan = require('./models/Loan');
const User = require('./models/User');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serves CSS, JS, images from 'public/'

app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
}));

// Set EJS view engine
app.set("view engine", "ejs");

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/expenseTrackerDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify is deprecated in Mongoose 6+, you can omit it
})
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.log("MongoDB connection error: ", err));

// Middleware to protect routes
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Home Page
app.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    const loans = await Loan.find();

    const totalIncome = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0);
    const totalLoans = loans.reduce((acc, l) => acc + l.amount, 0);
    const totalPaid = loans.reduce((acc, l) => acc + (l.paidAmount || 0), 0);
    const totalRemaining = totalLoans - totalPaid;

    res.render("index", {
      transactions,
      loans,
      totalIncome,
      totalExpenses,
      totalLoans,
      totalPaid,
      totalRemaining,
      user: req.session.user
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching data");
  }
});

// Loans Page
app.get("/loans", requireLogin, async (req, res) => {
  try {
    const loans = await Loan.find();
    res.render("loans", { loans });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching loans");
  }
});

// Login
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { username: user.username, email: user.email };
      return res.redirect("/");
    }
    res.send("Invalid email or password");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error logging in");
  }
});

// Signup
app.get("/signup", (req, res) => {
  res.render("signup");
});
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.send("User already exists.");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error signing up");
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Add Transaction
app.post("/add", requireLogin, async (req, res) => {
  const { text, amount } = req.body;
  if (!text || !amount) return res.redirect("/");
  try {
    const newTransaction = new Transaction({ text, amount: parseFloat(amount) });
    await newTransaction.save();
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding transaction");
  }
});

// Delete Transaction
app.post("/delete/:id", requireLogin, async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting transaction");
  }
});

// Add Loan
app.post("/loans/add", requireLogin, async (req, res) => {
  const { name, amount } = req.body;
  if (!name || !amount) return res.redirect("/loans");
  try {
    const newLoan = new Loan({ name, amount: parseFloat(amount), paidAmount: 0 });
    await newLoan.save();
    res.redirect("/loans");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding loan");
  }
});

// Pay Loan
app.post("/loans/pay/:id", requireLogin, async (req, res) => {
  const id = req.params.id;
  const { payment } = req.body;
  if (!payment) return res.redirect("/loans");
  try {
    const loan = await Loan.findById(id);
    loan.paidAmount += parseFloat(payment);
    await loan.save();
    res.redirect("/loans");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error paying loan");
  }
});

// Delete Loan
app.post("/loans/delete/:id", requireLogin, async (req, res) => {
  try {
    await Loan.findByIdAndDelete(req.params.id);
    res.redirect("/loans");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting loan");
  }
});

// Contact Page - GET
app.get("/contact", (req, res) => {
  res.render("contact");
});

// Contact Form Submission - POST
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.render("contact", { error: "All fields are required!" });
  }

  // You can add database saving or email sending logic here
  console.log("Contact form submitted:", { name, email, message });

  res.render("contact", { success: "Thank you for reaching out! We'll get back to you soon." });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
