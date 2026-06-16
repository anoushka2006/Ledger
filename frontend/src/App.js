import { useState, useEffect } from "react";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});

  const totalIncome = transactions
    .filter(t => t.amount >= 0)
    .reduce((total, t) => total + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((total, t) => total + t.amount, 0) * -1;
  const netBalance = totalIncome - totalExpenses;

  useEffect(() => {
    fetch("http://127.0.0.1:5000/transactions")
      .then(res => res.json())
      .then(data => setTransactions(data))

    fetch("http://127.0.0.1:5000/summary")
      .then(res => res.json())
      .then(data => setSummary(data))
  }, []);

  return (
    <div>
      <h1>Finance Dashboard</h1>
      <div>
        <h2>Total Income: ${totalIncome}</h2>
        <h2>Total Expenses: ${totalExpenses}</h2>
        <h2>Net Balance: ${netBalance}</h2>
      </div>
      <ul>
        {transactions.map((t, index) => (
          <li key={index}>
            {t.date} | {t.category} | ${t.amount} | {t.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;