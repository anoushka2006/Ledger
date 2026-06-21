import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});

  // calculations for banner header
  const totalIncome = transactions
    .filter(t => t.amount >= 0)
    .reduce((total, t) => total + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((total, t) => total + t.amount, 0) * -1;
  const netBalance = totalIncome - totalExpenses;

  const [activePeriod, setActivePeriod] = useState("All Time");

  //Form inputs
  const [formData, setFormData] = useState({
    date: "",
    category: "",
    amount: "",
    description: "",
    type: "debit",
    included: true
  });

  // group by month
  const groupByMonth = (transactions) => {
    const months = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = date.toLocaleString("default", { month: "short" }) + " " + date.getFullYear();
      
      if (!months[key]) {
        months[key] = { month: key, income: 0, expenses: 0 };
      }
      
      if (t.amount >= 0) {
        months[key].income += t.amount;
      } else {
        months[key].expenses += Math.abs(t.amount);
      }
    });
    
    return Object.values(months);
  };
  const monthlyData = groupByMonth(transactions).sort((a, b) => {
    return new Date("01 " + a.month) - new Date("01 " + b.month);
  });


  // category expenses
  const categoryChartData = Object.entries(summary)
    .filter(([key, value]) => value < 0)
    .map(([key, value]) => ({ name: key, value: Math.abs(value) }));

  const categoryColors = {
    entertainment: "#6366f1",
    food: "#f97316",
    shopping: "#22c55e",
    transport: "#eab308",
    work: "#ec4899",
    subscriptions: "#14b8a6",
    family: "#60a5fa",
    other: "#9ca3af"
  };

  // card summary data
  const avgMonthlySpend = monthlyData.length > 0 
    ? totalExpenses / monthlyData.length 
    : 0;

  const transactionCount = transactions.length;

  const largestExpense = transactions
    .filter(t => t.amount < 0)
    .reduce((min, t) => t.amount < min ? t.amount : min, 0);

  const topCategory = Object.entries(summary)
    .filter(([_, v]) => v < 0)
    .sort((a, b) => a[1] - b[1])[0]?.[0] ?? "N/A";

  const lastMonthSpend = monthlyData.length >= 2 
    ? monthlyData[monthlyData.length - 2].expenses 
    : 0;
  const spendingChange = lastMonthSpend > 0 
    ? ((monthlyData[monthlyData.length - 1]?.expenses - lastMonthSpend) / lastMonthSpend * 100).toFixed(1)
    : "N/A";

  const lastParentTransaction = [...transactions]
    .filter(t => t.category === "family" && t.amount > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];


  //Notes section
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");


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
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-white font-bold text-xl tracking-tight">◆ Finance Tracker</h1>
        <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
          {["All Time", "Yearly", "6 Months", "Monthly"].map(period => (
            <button
              key={period}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activePeriod === period
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActivePeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </nav>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 border-b border-gray-700">
        <div className="p-6 border-r border-gray-700">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            <span className="text-green-400">↗</span> Total Income
          </p>
          <p className="text-green-400 text-4xl font-bold mt-2">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="p-6 border-r border-gray-700">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            <span className="text-red-400">↘</span> Total Expenses
          </p>
          <p className="text-red-400 text-4xl font-bold mt-2">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="p-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest">↗ Net Balance</p>
          <p className="text-green-400 text-4xl font-bold mt-2">
            {netBalance < 0 ? `-$${Math.abs(netBalance).toFixed(2)}` : `$${netBalance.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-gray-700 p-6 min-h-screen">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Add Transaction</p>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Date</label>
              <input type="date" value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="bg-gray-800 text-white px-3 py-2 rounded text-sm w-full"/>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Category</label>
              <select value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="bg-gray-800 text-white px-3 py-2 rounded text-sm w-full">
                <option value="" disabled>Select category</option>
                <option value="food">Food</option>
                <option value="shopping">Shopping</option>
                <option value="transport">Transport/Travel</option>
                <option value="entertainment">Entertainment/Fun</option>
                <option value="work">Work/Income</option>
                <option value="subscriptions">Subscriptions</option>
                <option value="family">Family</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Amount (USD)</label>
              <input type="number" value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                className="bg-gray-800 text-white px-3 py-2 rounded text-sm w-full"/>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Description</label>
              <input type="text" value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description..."
                className="bg-gray-800 text-white px-3 py-2 rounded text-sm w-full"/>
            </div>

            {/* Debit/Credit toggle */}
            <div className="flex">
              <button type="button"
                onClick={() => setFormData({...formData, type: "debit"})}
                className={`flex-1 py-2 text-sm font-bold ${formData.type === "debit" ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400"}`}>
                DEBIT
              </button>
              <button type="button"
                onClick={() => setFormData({...formData, type: "credit"})}
                className={`flex-1 py-2 text-sm font-bold ${formData.type === "credit" ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400"}`}>
                CREDIT
              </button>
            </div>

            {formData.type === "credit" && (
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" checked={formData.included}
                  onChange={(e) => setFormData({...formData, included: e.target.checked})}/>
                Include in calculations
              </label>
            )}

            <button type="submit"
              className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded text-sm w-full">
              + Add Entry
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">
              ⚠ Emergency Notes
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log an emergency transaction..."
                className="bg-gray-800 text-white px-3 py-2 rounded text-sm flex-1"
              />
              <button
                onClick={() => {
                  if (newNote.trim()) {
                    setNotes([...notes, {text: newNote, date: new Date().toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}]);
                    setNewNote("");
                  }
                }}
                className="bg-yellow-500 text-black font-bold px-3 py-2 rounded text-sm"
              >
                +
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {notes.map((note, index) => (
                <div key={index} className="bg-gray-800 rounded p-3">
                  <p className="text-sm text-white">{note.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{note.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Right Main Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-6 mt-2">

            {/* Bar chart on left */}
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Income vs Expenses Trend</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <XAxis 
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{fill: "#6b7280", fontSize: 11}}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#6b7280" tick={{fill: "#6b7280", fontSize: 12}}/>
                  <Tooltip
                    contentStyle={{backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px"}}
                    labelStyle={{color: "#f9fafb"}}
                    itemStyle={{color: "#9ca3af"}}
                    formatter={(value, name) => [`$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="income" fill="#22c55e" radius={[4,4,0,0]} background={{fill: "transparent"}}/>
                <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} background={{fill: "transparent"}}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
  
            {/* Donut chart on right */}
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Category Breakdown</p>
              <ResponsiveContainer width="85%" height={300}>
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={["#6366f1","#f97316","#22c55e","#eab308","#ec4899","#14b8a6"][index % 6]}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: "#1f2937", border: "none"}}/>
                  <Legend
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{fontSize: "14px", color: "#9ca3af"}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            {/* At a Glance */}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">At a Glance</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Avg Monthly Spend</p>
                  <p className="text-green-400 text-xl font-bold mt-1">${avgMonthlySpend.toFixed(2)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Transactions</p>
                  <p className="text-white text-xl font-bold mt-1">{transactionCount}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Largest Expense</p>
                  <p className="text-red-400 text-xl font-bold mt-1">-${Math.abs(largestExpense).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {transactions.find(t => t.amount === largestExpense)?.description ?? ""}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Top Category</p>
                  <p className="text-white text-xl font-bold mt-1 capitalize">{topCategory}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${Math.abs(summary[topCategory] ?? 0).toFixed(2)} total
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Spending vs Last Month</p>
                  <p className={`text-xl font-bold mt-1 ${spendingChange > 0 ? "text-red-400" : "text-green-400"}`}>
                    {spendingChange === "N/A" ? "N/A" : `${spendingChange}%`}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Last Allowance / Deposit</p>
                  {lastParentTransaction ? (
                    <>
                      <p className="text-white text-xl font-bold mt-1">
                        {new Date(lastParentTransaction.date).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}
                      </p>
                     <p className="text-xs text-gray-500 mt-1">+${lastParentTransaction.amount.toFixed(2)}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm mt-1">No deposits recorded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Recent Transactions</p>
              <div className="flex flex-col gap-2">
                {[...transactions]
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .reverse()
                  .slice(0, 8)
                  .map((t, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-700 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" 
                          style={{backgroundColor: categoryColors[t.category] || "#9ca3af"}}>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.description}</p>
                          <p className="text-xs text-gray-400">{t.category} · {new Date(t.date).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${t.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                        {t.amount < 0 ? `-$${Math.abs(t.amount)}` : `+$${t.amount}`}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Charts + transactions go here */}
        </div>
      </div>
    </div>
  );
}

export default App;