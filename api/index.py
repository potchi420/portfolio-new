import os

import dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

dotenv.load_dotenv()

app = Flask(__name__)
CORS(app)

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.md")


def load_facts():
    with open(DATA_FILE, encoding="utf-8") as f:
        return f.read()


@app.route("/api/chat", methods=["POST"])
def chat():
    body = request.get_json(silent=True) or {}
    user_message = (body.get("message") or "").strip()

    if not user_message:
        return jsonify({"error": "message is required"}), 400

    facts = load_facts()

    # SECTION A — build the system prompt (your turn)

    # SECTION B — call the DeepSeek API (your turn)

    # SECTION C — return the reply (your turn)

    return jsonify({"reply": ""})


if __name__ == "__main__":
    app.run(debug=True)