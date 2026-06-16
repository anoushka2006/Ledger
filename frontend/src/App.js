import { useState, useEffect } from "react";

function App() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/transactions")
      .then(res => res.json())
      .then(data => setTransactions(data))
  }, []);

  return (
    <div>
      <h1>Finance Dashboard</h1>
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