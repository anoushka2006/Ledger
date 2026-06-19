import pandas as pd

transactions = [
    {"date": "2026-06-10", "category": "entertainment", "amount": -25, "description": "laser tag", "included": True},
    {"date": "2026-05-28", "category": "food", "amount": -17, "description": "dinner", "included": True},
    {"date": "2026-05-29", "category": "work", "amount": 30, "description": "work", "included": True},
    {"date": "2026-05-20", "category": "food", "amount": -50, "description": "groceries", "included": True},
    {"date": "2026-05-24", "category": "family", "amount": 400, "description": "parents", "included": True}
]

pd.DataFrame(transactions).to_csv("data/sample_transactions.csv", index=False)

# Empty credit transactions file with correct headers
pd.DataFrame(columns=["date", "category", "amount", "description", "included"]).to_csv("data/credit_transactions.csv", index=False)