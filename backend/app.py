from typing import List

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from backend.types.chat_types import ChatRequest, Message, ChatResponse

app = Flask(__name__)
# Enable CORS (Which allows the frontend to send requests to this server)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat() -> Response:
    data: ChatRequest = ChatRequest.from_dict(request.json)
    messages: List[Message] = data.messages
    semesters: str = data.semesters
    current_selected_course_ids: List[str] = data.current_selected_course_id

    # Debugging
    print("=== Received data ===")
    print(f"semesters: {semesters}")
    [print(f"role: {msg.role}, content: {msg.content}") for msg in messages]
    print(f"currentSelectedCourseId: {current_selected_course_ids}")
    print("=====================")

    # Forwards the request to the logic module...

    # Example response logic
    response_message: str = "根據你的喜好與查詢，我推薦你一些有關AI的課程，希望對你有幫助！包誇: 機器學習、人工智慧導論、資料探勘與應用、自然語言處理" # 示例回應訊息
    ranked_course_ids: List[str] = ["AI50001", "AI10001", "AI50003", "AI50004"]  # 示例課程 ID
    response: ChatResponse = ChatResponse(response=response_message, ranked_course_ids=ranked_course_ids)

    return jsonify(response.to_dict())

if __name__ == '__main__':
    app.run(debug=True)
