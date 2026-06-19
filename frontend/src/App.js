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

  const [formData, setFormData] = useState({
    date: "",
    category: "",
    amount: "",
    description: "",
    type: "debit",
    included: true
  });

  const handleSubmit = (e) => {
    e.preventDefault(); // stops page from reloading
    fetch("http://127.0.0.1:5000/transactions", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({...formData, amount: parseFloat(formData.amount)})
    }).then(() => {
      // re-fetch transactions after adding
      fetch("http://127.0.0.1:5000/transactions")
        .then(res => res.json())
        .then(data => setTransactions(data))
      setFormData({date: "", category: "", amount: "", description: "", type: "debit", included: true});
    })
  }

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
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          placeholder="Date"
        />
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="" disabled>Category</option>
          <option value="food">Food</option>
          <option value="shopping">Shopping</option>
          <option value="transport">Transport/Travel</option>
          <option value="entertainment">Entertainment/Fun</option>
          <option value="work">Work/Income</option>
          <option value="subscriptions">Subscriptions</option>
          <option value="family">Family</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
          placeholder="Amount"
        />
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Description"
        />
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
        >
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
        {formData.type === "credit" && (
          <label>
            <input
              type="checkbox"
              checked={formData.included}
              onChange={(e) => setFormData({...formData, included: e.target.checked})}
            />
            Include in calculations
          </label>
        )}
        <button type="submit">Add Transaction</button>
      </form>
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