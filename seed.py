import pandas as pd

transactions = [
    {"date": "2026-06-10", "category": "friends", "amount": -25, "description": "laser tag"},
    {"date": "2026-05-28", "category": "food", "amount": -17, "description": "dinner"},
    {"date": "2026-05-29", "category": "work", "amount": 30, "description": "work"},
    {"date": "2026-05-20", "category": "food", "amount": -50, "description": "groceries"},
    {"date": "2026-05-24", "category": "parents", "amount": 400, "description": "parents"}
]

pd.DataFrame(transactions).to_csv("data/sample_transactions.csv", index=False)