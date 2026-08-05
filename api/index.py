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

    # system prompt for the AI assistant
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
    - Avoid using em dashes or colons in your replies. Use commas or periods instead.
    - Limit the use of parentheses. If you must use them, keep them short and casual.
    - If asked about certifications, mention that Franz has a few, but don't list them unless asked. Keep it casual. 
    - If visitor persists in asking about certifications, say that he's got a CS50 certificate and he's a member of JPCS (Junior Philippine Computer Society)
    - If asked about current self study or something, mention that he's currently self studying AI and ML, TheOdinProject, and other things.
    """

    # call the DeepSeek API to get a response from the AI assistant
    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )

    # check if the response has choices and return the first one
    if response.choices and len(response.choices) > 0:
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    else:
        return jsonify({"reply": ""})


if __name__ == "__main__":
    app.run(debug=True)