const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 3001;

const Transaction = require("./models/Transaction");
const Loan = require("./models/Loan");
const User = require("./models/User");
const Contact = require("./models/Contact");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  console.log("Session user:", req.session.user);
  next();
});

app.set("view engine", "ejs");

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/expenseTrackerDB")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Helper functions
function requireLogin(req, res, next) {
  if (!req.session.user) {
    console.log("User not logged in, redirecting to login page.");
    return res.redirect("/login");
  }
  next();
}
function getUserId(req) {
  try {
    const id = new mongoose.Types.ObjectId(req.session.user._id);
    console.log("Parsed userId:", id);
    return id;
  } catch (err) {
    console.log("Error parsing userId:", err);
    return null;
  }
}
// Routes

app.get("/", requireLogin, async (req, res) => {
  console.log("Session user in / route:", req.session.user);
  const userId = getUserId(req);
  if (!userId) {
    console.log("Invalid userId, redirecting to /login");
    return res.redirect("/login");
  }

  try {
    const transactions = await Transaction.find({ user: userId });
    const loans = await Loan.find({ user: userId });

    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => acc + t.amount, 0);

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
      user: req.session.user,
      error: null
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading dashboard");
  }
});

app.get("/loans", requireLogin, async (req, res) => {
  try {
    const userId = getUserId(req);
    const loans = await Loan.find({ user: userId });
    const error = req.query.error || null;
    res.render("loans", { loans, user: req.session.user, error });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading loans");
  }
});

app.get("/myloans", requireLogin, (req, res) => {
  res.redirect("/loans");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});
app.post("/login", async (req, res) => {
  console.log("Login POST received:", req.body);
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("No user found with email:", email);
      return res.render("login", { error: "Invalid email or password" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log("Password mismatch for user:", email);
      return res.render("login", { error: "Invalid email or password" });
    }

    // Set session user data
    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    req.session.save((err) => {
      if (err) {
        console.log("Session save error:", err);
        return res.status(500).send("Session error");
      }
      console.log("Login successful for user:", email);
      res.redirect("/");
    });
  } catch (err) {
    console.log("Login error:", err);
    res.status(500).send("Login error");
  }
});
app.get("/signup", (req, res) => {
  console.log("GET /signup route hit");
  res.render("signup", { error: null });
});


app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.render("signup", { error: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    res.status(500).render("signup", { error: "Signup failed. Try again." });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.post("/add", requireLogin, async (req, res) => {
  const { text, amount } = req.body;
  if (!text || !amount) return res.redirect("/?error=Missing fields");
  try {
    const userId = getUserId(req);
    const newTransaction = new Transaction({
      text,
      amount: parseFloat(amount),
      user: userId,
      userEmail: req.session.user.email,
    });
    await newTransaction.save();
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding transaction");
  }
});

app.post("/delete/:id", requireLogin, async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await Transaction.deleteOne({ _id: req.params.id, user: userId });
    if (result.deletedCount === 0) return res.status(403).send("Unauthorized");
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting transaction");
  }
});

app.post("/loans/add", requireLogin, async (req, res) => {
  const { name, amount } = req.body;
  if (!name || !amount) return res.redirect("/loans?error=All fields required");
  try {
    const userId = getUserId(req);
    const newLoan = new Loan({
      name,
      amount: parseFloat(amount),
      paidAmount: 0,
      user: userId
    });
    await newLoan.save();
    res.redirect("/loans");
  } catch (err) {
    console.log(err);
    res.redirect("/loans?error=Error adding loan");
  }
});

app.post("/loans/pay/:id", requireLogin, async (req, res) => {
  const { payment } = req.body;
  if (!payment) return res.redirect("/loans?error=Payment is required");
  try {
    const userId = getUserId(req);
    const loan = await Loan.findOne({ _id: req.params.id, user: userId });
    if (!loan) return res.redirect("/loans?error=Loan not found");

    loan.paidAmount += parseFloat(payment);
    await loan.save();
    res.redirect("/loans");
  } catch (err) {
    console.log(err);
    res.redirect("/loans?error=Payment error");
  }
});

app.post("/loans/delete/:id", requireLogin, async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await Loan.deleteOne({ _id: req.params.id, user: userId });
    if (result.deletedCount === 0) return res.redirect("/loans?error=Unauthorized");
    res.redirect("/loans");
  } catch (err) {
    console.log(err);
    res.redirect("/loans?error=Delete error");
  }
});

app.get("/contact", requireLogin, (req, res) => {
  res.render("contact", { error: null, success: null });
});

app.post("/contact", requireLogin, async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.render("contact", { error: "All fields are required!", success: null });
  }

  try {
    const userId = getUserId(req);
    const newContact = new Contact({ name, email, message, user: userId });
    await newContact.save();
    res.render("contact", {
      success: "Thank you for reaching out!",
      error: null,
    });
  } catch (err) {
    console.error("Error saving contact:", err);
    res.render("contact", {
      error: "Something went wrong. Please try again later.",
      success: null,
    });
  }
});
// Debug route
app.post('/test-login', (req, res) => {
  console.log('Test login route hit:', req.body);
  res.send('Test login route is working!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
