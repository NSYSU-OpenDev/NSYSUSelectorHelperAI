from typing import List, Dict, Any
from typing import TYPE_CHECKING

from flask_cors import CORS
from flask import Flask, request, jsonify, Response

# Only import for type checking
if TYPE_CHECKING:
    from types import Message

app = Flask(__name__)
# Enable CORS (Which allows the frontend to send requests to this server)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat() -> Response:
    data: 'any' = request.json
    messages: List['Message'] = data.get('messages', [])
    semesters: str = data.get('semesters', '')
    current_selected_course_ids: List[str] = data.get('currentSelectedCourseId', [])

    # Forwards the request to the logic module...

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
