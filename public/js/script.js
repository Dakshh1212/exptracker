document.addEventListener("DOMContentLoaded", function () {
  const balance = document.getElementById("balance");
  const moneyPlus = document.getElementById("moneyplus");
  const moneyMinus = document.getElementById("moneyminus");
  const list = document.getElementById("list");

  function updateValues() {
    const amounts = [...document.querySelectorAll("#list li span")].map(span =>
      parseFloat(span.textContent.replace(/[^0-9.-]+/g, ""))
    );

    const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0).toFixed(2);
    const expense = Math.abs(amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0)).toFixed(2);

    if (balance) balance.innerText = `$${total}`;
    if (moneyPlus) moneyPlus.innerText = `+$${income}`;
    if (moneyMinus) moneyMinus.innerText = `-$${expense}`;
  }

  list?.addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-btn")) {
      event.target.closest("form").submit();
    }
  });

  updateValues();
});
