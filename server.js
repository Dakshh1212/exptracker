const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

// JSON file paths
const transactionsFile = path.join(__dirname, "transactions.json");
const loansFile = path.join(__dirname, "loans.json");

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  const transactions = readJSON(transactionsFile);
  const loans = readJSON(loansFile);

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
    totalRemaining
  });
});

app.get("/loans", (req, res) => {
  const loans = readJSON(loansFile);
  res.render("loans", { loans });
});

app.post("/add", (req, res) => {
  const { text, amount } = req.body;
  if (!text || !amount) return res.redirect("/");
  const transactions = readJSON(transactionsFile);
  transactions.push({ id: Date.now(), text, amount: parseFloat(amount) });
  writeJSON(transactionsFile, transactions);
  res.redirect("/");
});

app.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const transactions = readJSON(transactionsFile).filter(t => t.id !== id);
  writeJSON(transactionsFile, transactions);
  res.redirect("/");
});

app.post("/loans/add", (req, res) => {
  const { name, amount } = req.body;
  if (!name || !amount) return res.redirect("/loans");

  const loans = readJSON(loansFile);
  loans.push({
    id: Date.now(),
    name,
    amount: parseFloat(amount),
    paidAmount: 0
  });

  writeJSON(loansFile, loans);
  res.redirect("/loans");
});

app.post("/loans/pay/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { payment } = req.body;
  if (!payment) return res.redirect("/loans");

  const loans = readJSON(loansFile);
  const updatedLoans = loans.map(loan => {
    if (loan.id === id) {
      loan.paidAmount = (loan.paidAmount || 0) + parseFloat(payment);
    }
    return loan;
  });

  writeJSON(loansFile, updatedLoans);
  res.redirect("/loans");
});
app.post("/loans/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const loans = readJSON(loansFile).filter(l => l.id !== id);
  writeJSON(loansFile, loans);
  res.redirect("/loans");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
