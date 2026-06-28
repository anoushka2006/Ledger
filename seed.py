import pandas as pd

# Empty all CSVs with correct headers
pd.DataFrame(columns=["date","category","amount","description","included"]).to_csv("data/transactions.csv", index=False)
pd.DataFrame(columns=["date","category","amount","description","included"]).to_csv("data/credit_transactions.csv", index=False)
pd.DataFrame(columns=["id","text","date"]).to_csv("data/notes.csv", index=False)

print("All CSVs cleared")