from typing import List

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from chat_types import ChatRequest, Message, ChatResponse

app = Flask(__name__)
# Enable CORS (Which allows the frontend to send requests to this server)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat() -> Response:
    data: ChatRequest = ChatRequest.from_dict(request.json)
    messages: List[Message] = data.messages
    semesters: str = data.semesters
    current_selected_course_ids: List[str] = data.currentSelectedCourseId

    # Debugging
    print("=== Received data ===")
    print(f"semesters: {semesters}")
    [print(f"role: {msg.role}, content: {msg.content}") for msg in messages]
    print(f"currentSelectedCourseId: {current_selected_course_ids}")
    print("=====================")

    # Forwards the request to the logic module...

    # Example response logic
    response_message: str = "這是一個來自伺服器的模擬回應。"
    ranked_course_ids: List[str] = ["course123", "course456"]  # 示例課程 ID
    response: ChatResponse = ChatResponse(response=response_message, ranked_course_ids=ranked_course_ids)

    return jsonify(response.to_dict())

if __name__ == '__main__':
    app.run(debug=True)
