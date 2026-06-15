from flask import Flask, jsonify
from backend.transactions import load_transactions, summarize_by_category

app = Flask(__name__)
TRANSACTIONS = load_transactions("data/sample_transactions.csv")

@app.route("/transactions", methods=["GET"])
def get_transactions():
    # return all transactions as JSON
    return jsonify(TRANSACTIONS)

@app.route("/summary", methods=["GET"])
def get_summary():
    return jsonify(summarize_by_category(TRANSACTIONS))

if __name__ == "__main__":
    app.run(debug=True)