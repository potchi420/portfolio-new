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
    system_prompt = f"""
    You are the friendly assistant for Franz Mesina's portfolio site.
    Visitors ask about Franz, his projects, skills, and experience.

    What you know about Franz:
    {facts}

    How to talk:
    - Be warm, casual, and a bit playful — like a helpful friend, not a support bot.
    - Just answer naturally. Never say things like "based on the facts provided"
    or "according to the data" — answer as if you just know it.
    - Vary your openings and closings. Never end two replies the same way.
    - Keep answers short and conversational. No heavy bullet lists unless they help.
    - Use contractions ("I'll", "that's") and the occasional light joke.
    - If asked something unrelated to Franz, turn it down gently and steer back — casually, not scripted.
    """

    # SECTION B — call the DeepSeek API (your turn)
    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )

    # SECTION C — return the reply (your turn)
    if response.choices and len(response.choices) > 0:
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    else:
        return jsonify({"reply": ""})


if __name__ == "__main__":
    app.run(debug=True)