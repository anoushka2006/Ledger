from flask import Flask, jsonify
from flask_cors import CORS
from flask import request
from backend.transactions import load_transactions, summarize_by_category, save_transactions, add_transaction
from backend.transactions import load_notes, save_notes

app = Flask(__name__)
CORS(app, origins="*")

TRANSACTIONS = load_transactions("data/transactions.csv")
CREDIT_TRANSACTIONS = load_transactions("data/credit_transactions.csv")

# Tag them at load time
for t in TRANSACTIONS:
    t["source"] = "debit"
for t in CREDIT_TRANSACTIONS:
    t["source"] = "credit"

INCLUDED_CREDIT = [t for t in CREDIT_TRANSACTIONS if t["included"] == True]
NOTES = load_notes("data/notes.csv")

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

@app.route("/credit-transactions", methods=["GET"])
def get_credit_transactions():
    return jsonify(CREDIT_TRANSACTIONS)


@app.route("/notes", methods=["GET"])
def get_notes():
    return jsonify(NOTES)

@app.route("/notes", methods=["POST"])
def add_note():
    global NOTES
    data = request.get_json()
    new_note = {
        "id": len(NOTES) + 1,
        "text": data["text"],
        "date": data["date"]
    }
    NOTES.append(new_note)
    save_notes(NOTES, "data/notes.csv")
    return jsonify({"status": "success"})

@app.route("/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    global NOTES
    NOTES = [n for n in NOTES if n["id"] != note_id]
    save_notes(NOTES, "data/notes.csv")
    return jsonify({"status": "success"})

@app.route("/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    global NOTES
    data = request.get_json()
    for note in NOTES:
        if note["id"] == note_id:
            note["text"] = data["text"]
    save_notes(NOTES, "data/notes.csv")
    return jsonify({"status": "success"})


if __name__ == "__main__":
    app.run(debug=True)