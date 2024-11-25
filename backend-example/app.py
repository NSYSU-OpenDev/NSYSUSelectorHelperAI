from typing import List, Dict, Any
from typing import TYPE_CHECKING


from flask import Flask, request, jsonify, Response

# Only import for type checking
if TYPE_CHECKING:
    from types import Message, ChatRequest

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def chat() -> Response:
    data: 'ChatRequest' = request.json
    messages: List['Message'] = data.messages if data.messages else []
    semesters: str = data.semesters if data.semesters else ""
    current_selected_course_ids: List[str] = data.currentSelectedCourseId if data.currentSelectedCourseId else []

    # Example response logic
    response_message: str = "這是一個來自伺服器的模擬回應。"
    ranked_course_ids: List[str] = ["course123", "course456"]  # 示例課程 ID
    response: Dict[str, Any] = {
        "response": response_message,
        "rankedCourseIds": ranked_course_ids
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
