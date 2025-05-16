const balance = document.getElementById("balance");
const money_plus = document.getElementById("moneyplus");
const money_minus = document.getElementById("moneyminus");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("Amount");

// Fetch transactions from the server
async function fetchTransactions() {
  const response = await fetch("/transactions");
  const transactions = await response.json();
  return transactions;
}

// Theme toggle button
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  toggle.addEventListener("click", () => {
    document.documentElement.toggleAttribute("data-theme", "dark");
  });
});

const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

// Check if a theme is already set in localStorage and apply it
if (currentTheme) {
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggleBtn.textContent = currentTheme === 'dark' ? '🌙' : '🌞';
} else {
  console.log('No theme set in localStorage.');
}

// Event listener to handle the theme toggle
themeToggleBtn.addEventListener('click', () => {
  let currentDataTheme = document.documentElement.getAttribute('data-theme');
  let newTheme = currentDataTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggleBtn.textContent = newTheme === 'dark' ? '🌙' : '🌞';
});

// Add transaction to server and DOM
async function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === "" || amount.value.trim() === "") {
    alert("Please enter both text and amount.");
    return;
  }

  const transaction = {
    text: text.value,
    amount: +amount.value
  };

  // Send transaction data to the server
  const response = await fetch("/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(transaction)
  });

  if (response.ok) {
    // Once the transaction is added, fetch updated transactions
    init();
  } else {
    alert("Failed to add transaction.");
  }

  // Clear input fields
  text.value = "";
  amount.value = "";
}

// Initialize page with transactions from server
async function init() {
  const transactions = await fetchTransactions();
  list.innerHTML = ""; // Clear existing list
  transactions.forEach(addTransactionDOM);
  updateValues(transactions);
}

// Function to add transaction to DOM
function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? "-" : "+";
  const item = document.createElement("li");

  item.classList.add(transaction.amount < 0 ? "minus" : "plus");

  item.innerHTML = `
    ${transaction.text} <span>${sign}$${Math.abs(transaction.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction('${transaction._id}')">x</button>
  `;

  list.appendChild(item);
}

// Update balance, income, and expense values
function updateValues(transactions) {
  const amounts = transactions.map(transaction => transaction.amount);

  const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
  const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0).toFixed(2);
  const expense = (amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1).toFixed(2);

  balance.innerText = `$${total}`;
  money_plus.innerText = `+$${income}`;
  money_minus.innerText = `-$${expense}`;
}

// Function to remove transaction
async function removeTransaction(id) {
  const response = await fetch(`/delete/${id}`, { method: "POST" });
  if (response.ok) {
    init(); // Re-fetch transactions after deletion
  } else {
    alert("Failed to remove transaction.");
  }
}

// Add event listener to form
form.addEventListener("submit", addTransaction);

// Initialize app
init();
