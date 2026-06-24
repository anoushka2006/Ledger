from datetime import datetime
import pandas as pd

# load transactions from transactions.csv
def load_transactions(filepath):
    df = pd.read_csv(filepath)
    return df.to_dict(orient = "records")

# save transactions to transactions.csv 
def save_transactions(transactions, filepath):
    df = pd.DataFrame(transactions)
    df.to_csv(filepath, index = False)
    return

# adding transaction to in-memory
def add_transaction(transactions, date, category, amount, description, included=True):
    new_transaction = {
        "date": date,
        "category": category,
        "amount": amount,
        "description": description,
        "included": included
    }
    transactions.append(new_transaction)
    return transactions


# to calculate total balance and expenses
def calculate_balance(transactions, balance = 0):
    for item in transactions:
        balance += item["amount"]
    
    return balance

#Filter by category
def filter_by_category(transactions, category):
    category_list = []
    
    for item in transactions:
            if item["category"] == category:
                category_list.append(item)
        
    return category_list

#Summarize by category
def summarize_by_category(transactions):
    category_spend = {}

    for item in transactions:
        if item["category"] in category_spend:
            category_spend[item["category"]] += item["amount"]
        else:
            category_spend[item["category"]] = item["amount"]    

    return category_spend

#Filter by month
def filter_by_month(transactions, year, month):
    date_list = []

    for item in transactions:
        date_str = datetime.strptime(item["date"], "%Y-%m-%d")

        if date_str.year == year and date_str.month == month:
            date_list.append(item)

    return date_list

#Filter by year
def filter_by_year(transactions, year):
    date_list = []

    for item in transactions:
        date_str = datetime.strptime(item["date"], "%Y-%m-%d")

        if date_str.year == year:
            date_list.append(item)

    return date_list

#Filter by week
def filter_by_week(transactions, year, week_number):
    date_list = []

    for item in transactions:
        date_str = datetime.strptime(item["date"], "%Y-%m-%d")

        if date_str.year == year and date_str.isocalendar().week == week_number:
            date_list.append(item)

    return date_list


# Notes
def load_notes(filepath):
    try:
        df = pd.read_csv(filepath)
        return df.to_dict(orient="records")
    except:
        return []

def save_notes(notes, filepath):
    df = pd.DataFrame(notes)
    df.to_csv(filepath, index=False)