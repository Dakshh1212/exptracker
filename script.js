const balance = document.getElementById("balance");
const money_plus = document.getElementById("moneyplus");
const money_minus = document.getElementById("moneyminus");
const list = document.getElementById("list");
const form = document.getElementById("transaction-form");
const text = form.querySelector('input[name="text"]');
const amount = form.querySelector('input[name="amount"]'); // changed to lowercase to match your input name

// Fetch transactions from the server
async function fetchTransactions() {
  const response = await fetch("/transactions");
  if (!response.ok) throw new Error("Failed to fetch transactions");
  return await response.json();
}

// Theme toggle button handling
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  // Load theme from localStorage and set button icon
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    toggle.textContent = currentTheme === 'dark' ? '🌙' : '🌞';
  }

  toggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    toggle.textContent = newTheme === "dark" ? "🌙" : "🌞";
  });
});

// Add transaction to server and refresh UI
async function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === "" || amount.value.trim() === "") {
    alert("Please enter both text and amount.");
    return;
  }

  const transaction = {
    text: text.value.trim(),
    amount: parseFloat(amount.value)
  };

  try {
    const response = await fetch("/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) throw new Error("Failed to add transaction.");

    // Clear input fields
    text.value = "";
    amount.value = "";

    // Refresh transaction list and balance
    await init();
  } catch (error) {
    alert(error.message);
  }
}

// Render transactions on the page
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

// Update the balance, income, and expense UI
function updateValues(transactions) {
  const amounts = transactions.map(t => t.amount);

  const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
  const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0).toFixed(2);
  const expense = (amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1).toFixed(2);

  balance.textContent = `$${total}`;
  money_plus.textContent = `+$${income}`;
  money_minus.textContent = `-$${expense}`;
}

// Remove transaction from server and refresh UI
async function removeTransaction(id) {
  try {
    const response = await fetch(`/delete/${id}`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to remove transaction.");
    await init();
  } catch (error) {
    alert(error.message);
  }
}

// Initialize app by fetching and rendering transactions
async function init() {
  try {
    const transactions = await fetchTransactions();
    list.innerHTML = "";
    transactions.forEach(addTransactionDOM);
    updateValues(transactions);
  } catch (error) {
    alert(error.message);
  }
}

// Form submit listener
form.addEventListener("submit", addTransaction);

// Start the app
init();
