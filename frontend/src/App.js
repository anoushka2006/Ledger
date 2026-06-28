import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";

function App() {
  const [transactions, setTransactions] = useState([]);

  // Credit transactions
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const [activePeriod, setActivePeriod] = useState("All Time");

  // Toggle wiring
  //const [activePeriod, setActivePeriod] = useState("All Time"); // already have this
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Semester state
  const getCurrentSemester = () => {
  const month = new Date().getMonth() + 1;
    if (month <= 4) return "Spring";
    if (month <= 8) return "Summer";
    if (month <= 11) return "Fall";
    return "Winter";
  };
  const [selectedSemester, setSelectedSemester] = useState(getCurrentSemester());
  
  // Chart toggle
  const [chartType, setChartType] = useState("line");

  // Filtered transactions for toggle including credit transactions
  const allTransactions = [...transactions, ...creditTransactions];

  const filteredTransactions = (() => {
    if (activePeriod === "All Time") return allTransactions;
    if (activePeriod === "Monthly") return allTransactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
    });
    if (activePeriod === "Yearly") return allTransactions.filter(t => {
      return new Date(t.date).getFullYear() === selectedYear;
    });
    if (activePeriod === "Semester") {
      const semesterMonths = {
        "Spring": [1,2,3,4],
        "Summer": [5,6,7,8],
        "Fall": [9,10,11],
        "Winter": [12]
      };
      return allTransactions.filter(t => {
        const date = new Date(t.date);
        return semesterMonths[selectedSemester]?.includes(date.getMonth() + 1)
          && date.getFullYear() === selectedYear;
      });
    }
    return allTransactions;
  })();

  const calculationTransactions = filteredTransactions.filter(t =>
    t.source === "debit" || t.included === true || t.included === "True"
  );
  
  // calculations for banner header
  const totalIncome = calculationTransactions
    .filter(t => t.amount >= 0)
    .reduce((total, t) => total + t.amount, 0);
  const totalExpenses = calculationTransactions
    .filter(t => t.amount < 0)
    .reduce((total, t) => total + t.amount, 0) * -1;
  const netBalance = totalIncome - totalExpenses;

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
    if (transactions.length === 0) return [];
    
    const months = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = date.toLocaleString("default", { month: "short" }) + " " + date.getFullYear();
      if (!months[key]) months[key] = { month: key, income: 0, expenses: 0 };
      if (t.amount >= 0) months[key].income += t.amount;
      else months[key].expenses += Math.abs(t.amount);
    });

  // Fill gaps between first and last transaction
    const dates = transactions.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const current = new Date(minDate.getFullYear(), minDate.getMonth());
    while (current <= maxDate) {
      const key = current.toLocaleString("default", { month: "short" }) + " " + current.getFullYear();
      if (!months[key]) months[key] = { month: key, income: 0, expenses: 0 };
      current.setMonth(current.getMonth() + 1);
    }

    return Object.values(months);
  };

  const monthlyData = groupByMonth(calculationTransactions).sort((a, b) => {
    return new Date("01 " + a.month) - new Date("01 " + b.month);
  });


  // group by week
  const groupByWeek = (transactions) => {
    if (transactions.length === 0) return [];
    
    const weeks = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const dayOfWeek = date.getDay();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - dayOfWeek);
      const key = weekStart.toLocaleDateString("en-US", {month: "short", day: "numeric"});
      
      if (!weeks[key]) weeks[key] = { week: key, income: 0, expenses: 0, sort: weekStart.getTime() };
      if (t.amount >= 0) weeks[key].income += t.amount;
      else weeks[key].expenses += Math.abs(t.amount);
    });

    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.date));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      const current = new Date(minDate);
      current.setDate(current.getDate() - current.getDay());
      while (current <= maxDate) {
        const key = current.toLocaleDateString("en-US", {month: "short", day: "numeric"});
        if (!weeks[key]) weeks[key] = { week: key, income: 0, expenses: 0, sort: current.getTime() };
        current.setDate(current.getDate() + 7);
      }
    }

    return Object.values(weeks).sort((a, b) => a.sort - b.sort);
  };

  // bar and line chart data selection
  const chartData = (() => {
    if (activePeriod === "Monthly") return groupByWeek(calculationTransactions);
    if (activePeriod === "Semester" && chartType === "line") return groupByWeek(calculationTransactions);
    return monthlyData;
  })();


  // category expenses
  const categoryChartData = Object.entries(
    calculationTransactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }));

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

  // Custom tooltip for the category breakdown
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const name = payload[0].name;
      const color = payload[0].payload.fill || categoryColors[name] || "#9ca3af";
      const total = categoryChartData.reduce((sum, c) => sum + c.value, 0);
      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-gray-800 px-4 py-3 rounded-lg text-sm border border-gray-700">
          <p className="capitalize font-semibold mb-1" style={{color}}>{name}</p>
          <p className="text-white font-bold text-base">${value.toFixed(2)}</p>
          <p className="text-gray-400 mt-0.5">{pct}%</p>
        </div>
      );
    }
    return null;
  };


  // At A Glance Data
  const avgMonthlySpend = monthlyData.length > 0 
    ? totalExpenses / monthlyData.length 
    : 0;

  const transactionCount = calculationTransactions.length;


  // Shows the most recent if a tie
  const largestExpenseTransaction = calculationTransactions
    .filter(t => t.amount < 0)
    .sort((a, b) => a.amount - b.amount || new Date(b.date) - new Date(a.date))[0];

  const largestExpense = largestExpenseTransaction?.amount ?? 0;

  const topCategory = categoryChartData.sort((a,b) => b.value - a.value)[0]?.name ?? "N/A";

  // Spending vs Last month
  const getPreviousMonthSpend = () => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() + 1 === prevMonth && date.getFullYear() === prevYear && t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const lastMonthSpend = (() => {
    if (activePeriod === "Monthly") return getPreviousMonthSpend();
    if (activePeriod === "Yearly") {
      return transactions
        .filter(t => new Date(t.date).getFullYear() === selectedYear - 1 && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }
    if (activePeriod === "Semester") {
      const semesterMonths = {
        "Spring": [1,2,3,4], "Summer": [5,6,7,8],
        "Fall": [9,10,11], "Winter": [12]
      };
      const prevSemesters = ["Spring", "Summer", "Fall", "Winter"];
      const idx = prevSemesters.indexOf(selectedSemester);
      const prevSemester = idx === 0 ? "Winter" : prevSemesters[idx - 1];
      const prevYear = idx === 0 ? selectedYear - 1 : selectedYear;
      return transactions
        .filter(t => {
          const date = new Date(t.date);
          return semesterMonths[prevSemester]?.includes(date.getMonth() + 1)
            && date.getFullYear() === prevYear && t.amount < 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }
    return monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2].expenses : 0;
  })();
  
  const spendingChange = lastMonthSpend > 0 
    ? ((monthlyData[monthlyData.length - 1]?.expenses - lastMonthSpend) / lastMonthSpend * 100).toFixed(1)
    : "N/A";


  const lastParentTransaction = [...transactions]
    .filter(t => t.category === "family" && t.amount > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];


  //Categpry filter on All Transactions Overlay
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://127.0.0.1:5000/transactions", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({...formData, amount: parseFloat(formData.amount)})
    }).then(() => {
      fetch("http://127.0.0.1:5000/transactions")
        .then(res => res.json())
        .then(data => setTransactions(data));
      
      fetch("http://127.0.0.1:5000/credit-transactions")
        .then(res => res.json())
        .then(data => setCreditTransactions(data));

      setFormData({date: "", category: "", amount: "", description: "", type: "debit", included: true});
    });
  };

  // Notes section
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Add note
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      text: newNote,
      date: new Date().toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})
    };
    fetch("http://127.0.0.1:5000/notes", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(note)
    }).then(() => {
      fetch("http://127.0.0.1:5000/notes")
        .then(res => res.json())
        .then(data => setNotes(data));
      setNewNote("");
    });
  };


  useEffect(() => {
    fetch("http://127.0.0.1:5000/transactions")
      .then(res => res.json())
      .then(data => setTransactions(data))

    fetch("http://127.0.0.1:5000/notes")
      .then(res => res.json())
      .then(data => setNotes(data))

    fetch("http://127.0.0.1:5000/credit-transactions")
      .then(res => res.json())
      .then(data => setCreditTransactions(data))
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-white font-bold text-xl tracking-tight">◆ Finance Tracker</h1>
        
        {/* Monthly Picker */}
        {activePeriod === "Monthly" && (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1">
            <button onClick={() => {
              const date = new Date(selectedYear, selectedMonth - 2);
              setSelectedMonth(date.getMonth() + 1);
              setSelectedYear(date.getFullYear());
            }} className="text-gray-400 hover:text-white font-bold px-2">←</button>
            <span className="text-sm text-white w-28 text-center">
              {new Date(selectedYear, selectedMonth - 1).toLocaleString("default", {month: "long", year: "numeric"})}
            </span>
            <button onClick={() => {
              const date = new Date(selectedYear, selectedMonth);
              setSelectedMonth(date.getMonth() + 1);
              setSelectedYear(date.getFullYear());
            }} className="text-gray-400 hover:text-white font-bold px-2">→</button>
          </div>
        )}

        {/* Semester Picker */}
        {activePeriod === "Semester" && (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1">
            <button onClick={() => {
              const semesters = ["Spring", "Summer", "Fall", "Winter"];
              const idx = semesters.indexOf(selectedSemester);
              if (idx === 0) { setSelectedSemester("Winter"); setSelectedYear(selectedYear - 1); }
              else setSelectedSemester(semesters[idx - 1]);
            }} className="text-gray-400 hover:text-white font-bold px-2">←</button>
            <span className="text-sm text-white w-28 text-center">{selectedSemester} {selectedYear}</span>
            <button onClick={() => {
              const semesters = ["Spring", "Summer", "Fall", "Winter"];
              const idx = semesters.indexOf(selectedSemester);
              if (idx === 3) { setSelectedSemester("Spring"); setSelectedYear(selectedYear + 1); }
              else setSelectedSemester(semesters[idx + 1]);
            }} className="text-gray-400 hover:text-white font-bold px-2">→</button>
          </div>
        )}

        {/* Year Picker */}
        {activePeriod === "Yearly" && (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1">
            <button onClick={() => setSelectedYear(selectedYear - 1)}
              className="text-gray-400 hover:text-white font-bold px-2">←</button>
            <span className="text-sm text-white w-16 text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(selectedYear + 1)}
              className="text-gray-400 hover:text-white font-bold px-2">→</button>
          </div>
        )}

        {/* Top bar */}
        <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
          {["All Time", "Yearly", "Semester", "Monthly"].map(period => (
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
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Notes</p>
            
            {/* Input always visible at top */}
            <div className="flex gap-2 mb-4">
              <textarea
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log a transaction note"
                rows = {2}
                className="bg-gray-800 text-white px-3 py-2 rounded text-sm flex-1"
              />
              <button onClick={handleAddNote}
                className="bg-yellow-500 text-black font-bold px-3 py-2 rounded text-sm">+</button>
            </div>

            {/* Notes list */}
            <div className="flex flex-col gap-3">
              {[...notes].reverse().map((note) => (
                <div key={note.id} className="bg-gray-800 rounded p-3">
                  {editingNoteId === note.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                        className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-full"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => {
                          fetch(`http://127.0.0.1:5000/notes/${note.id}`, {
                            method: "PUT",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({text: editingText})
                          }).then(() => {
                            fetch("http://127.0.0.1:5000/notes")
                              .then(res => res.json())
                              .then(data => setNotes(data));
                            setEditingNoteId(null);
                          });
                        }} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Save</button>
                        <button onClick={() => setEditingNoteId(null)}
                          className="text-xs bg-gray-600 text-white px-2 py-1 rounded">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-white whitespace-pre-wrap">{note.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{note.date}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setEditingNoteId(note.id); setEditingText(note.text); }}
                          className="text-xs text-gray-400 hover:text-white">Edit</button>
                        <button onClick={() => {
                          fetch(`http://127.0.0.1:5000/notes/${note.id}`, {method: "DELETE"})
                            .then(() => {
                              fetch("http://127.0.0.1:5000/notes")
                                .then(res => res.json())
                                .then(data => setNotes(data));
                            });
                        }} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Auto-notes for credit transactions */}
                {creditTransactions.filter(t => t.included === false || t.included === "False").length > 0 && (
                  <div className="bg-gray-800 rounded p-3 mt-3 border border-gray-700">
                    <p className="text-xs text-yellow-400 font-semibold mb-2">Credit — Not Included</p>
                    {creditTransactions
                      .filter(t => t.included === false || t.included === "False")
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((t, i) => (
                        <p key={i} className="text-xs text-gray-400 py-1 border-b border-gray-700 last:border-0">
                          {t.description} · ${Math.abs(t.amount)} · {new Date(t.date).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})} · {t.category}
                        </p>
                      ))}
                  </div>
                )}

                {creditTransactions.filter(t => t.included === true || t.included === "True").length > 0 && (
                  <div className="bg-gray-800 rounded p-3 mt-3 border border-gray-700">
                    <p className="text-xs text-blue-400 font-semibold mb-2">Credit — Included</p>
                    {creditTransactions
                      .filter(t => t.included === true || t.included === "True")
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((t, i) => (
                        <p key={i} className="text-xs text-gray-400 py-1 border-b border-gray-700 last:border-0">
                          {t.description} · ${Math.abs(t.amount)} · {new Date(t.date).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})} · {t.category}
                        </p>
                      ))}
                  </div>
                )}
            </div>
          </div>
        </div>  

        {/* Right Main Area */}
        <div className="flex-1 p-6 relative">

          {/* All Transactions Overlay */}
          {showAllTransactions && (
            <div className="absolute inset-0 bg-gray-900 z-10 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">All Transactions</p>
                <button onClick={() => setShowAllTransactions(false)}
                  className="text-gray-400 hover:text-white text-sm">✕ Close</button>
              </div>
              <div className="flex gap-2 flex-wrap mb-4">
                {["all", "food", "shopping", "transport", "entertainment", "work", "subscriptions", "family", "other"].map(cat => (
                  <button key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs capitalize ${categoryFilter === cat ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {[...filteredTransactions]
                  .filter(t => categoryFilter === "all" || t.category === categoryFilter)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((t, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full"
                          style={{backgroundColor: categoryColors[t.category] || "#9ca3af"}}/>
                        <div>
                          <p className="text-sm font-medium">
                            {t.description}
                            {t.source === "credit" && (
                              <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">credit</span>
                            )}
                          </p>
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
          )}

          {/* Dashboard Content */}
          <div className="grid grid-cols-2 gap-6 mt-2">

            {/* Bar chart on left */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Income vs Expenses Trend</p>
                <div className="flex bg-gray-800 rounded-lg p-0.5 gap-0.5">
                  <button onClick={() => setChartType("bar")}
                    className={`px-3 py-1 rounded text-xs font-medium ${chartType === "bar" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}>
                    Bar
                  </button>
                  <button onClick={() => setChartType("line")}
                    className={`px-3 py-1 rounded text-xs font-medium ${chartType === "line" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}>
                    Line
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {chartType === "bar" ? (
                  <BarChart data={chartData}>
                    <XAxis dataKey={activePeriod === "Monthly" || (activePeriod === "Semester" && chartType === "line") ? "week" : "month"} stroke="#6b7280" tick={{fill: "#6b7280", fontSize: 11}} interval="preserveStartEnd" angle={-30} textAnchor="end" height={60}/>
                    <YAxis stroke="#6b7280" tick={{fill: "#6b7280", fontSize: 12}}/>
                    <Tooltip contentStyle={{backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px"}} labelStyle={{color: "#f9fafb"}} itemStyle={{color: "#9ca3af"}} formatter={(value, name) => [`$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}/>
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} background={{fill: "transparent"}}/>
                    <Bar dataKey="income" fill="#22c55e" radius={[4,4,0,0]} background={{fill: "transparent"}}/>
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                    <XAxis dataKey={activePeriod === "Monthly" || (activePeriod === "Semester" && chartType === "line") ? "week" : "month"} stroke="#6b7280" tick={{fill: "#6b7280", fontSize: 11}} interval="preserveStartEnd" angle={-30} textAnchor="end" height={60}/>
                    <YAxis stroke="#6b7280" tick={{fill: "#6b7280", fontSize: 12}}/>
                    <Tooltip contentStyle={{backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px"}} labelStyle={{color: "#f9fafb"}} itemStyle={{color: "#9ca3af"}} formatter={(value, name) => [`$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}/>
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false}/>
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
  
            {/* Donut chart on right */}
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Category Breakdown</p>
              <ResponsiveContainer width="85%" height={300}>
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={categoryColors[entry.name] || "#9ca3af"}/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
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
                    {largestExpenseTransaction?.description ?? ""} · {largestExpenseTransaction?.date ? new Date(largestExpenseTransaction.date).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"}) : ""}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Top Category</p>
                  <p className="text-white text-xl font-bold mt-1 capitalize">{topCategory}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${categoryChartData.find(c => c.name === topCategory)?.value.toFixed(2) ?? 0} total
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400">
                    {activePeriod === "Yearly" ? "Spending vs Last Year" : 
                    activePeriod === "Semester" ? "Spending vs Last Semester" : 
                    "Spending vs Last Month"}
                  </p>
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
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Recent Transactions</p>
                <button onClick={() => setShowAllTransactions(true)}
                  className="text-xs text-blue-400 hover:text-blue-300">View All →</button>
              </div>
              <div className="flex flex-col gap-2">
                {[...filteredTransactions]
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
                          <p className="text-sm font-medium">
                            {t.description}
                            {t.source === "credit" && (
                              <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">credit</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{t.category} · {new Date(t.date).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${t.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                        {t.amount < 0 ? `-$${Math.abs(t.amount).toFixed(2)}` : `+$${parseFloat(t.amount).toFixed(2)}`}
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