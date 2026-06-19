from flask import Flask, jsonify
from flask_cors import CORS
from flask import request
from backend.transactions import load_transactions, summarize_by_category, save_transactions, add_transaction

app = Flask(__name__)
CORS(app, origins="*")

TRANSACTIONS = load_transactions("data/sample_transactions.csv")
CREDIT_TRANSACTIONS = load_transactions("data/credit_transactions.csv")
INCLUDED_CREDIT = [t for t in CREDIT_TRANSACTIONS if t["included"] == True]

@app.route("/transactions", methods=["GET"])
def get_transactions():
    # return all transactions as JSON
    return jsonify(TRANSACTIONS)

@app.route("/summary", methods=["GET"])
def get_summary():
    return jsonify(summarize_by_category(TRANSACTIONS))

@app.route("/transactions", methods=["POST"])
def add_transaction_api():
    global TRANSACTIONS
    global CREDIT_TRANSACTIONS
    data = request.get_json()

    if data["type"] == "debit":
        TRANSACTIONS = add_transaction(TRANSACTIONS, data["date"], data["category"], data["amount"], data["description"])
        save_transactions(TRANSACTIONS, "data/transactions.csv")
    else:
        CREDIT_TRANSACTIONS = add_transaction(CREDIT_TRANSACTIONS, data["date"], data["category"], data["amount"], data["description"], data["included"])
        save_transactions(CREDIT_TRANSACTIONS, "data/credit_transactions.csv")

    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(debug=True)