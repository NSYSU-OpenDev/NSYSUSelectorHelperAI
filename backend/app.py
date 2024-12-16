from typing import List

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import pandas as pd

from backend.service.query_generator import generate_potential_query
from backend.service.relative_search import CourseReranker
from backend.service.relative_search_bi_encoder import CourseRerankerWithFieldMapping
from backend.types.chat_types import ChatRequest, Message, ChatResponse
from backend.service.final_response_generator import generate_final_response

MAX_RETRY = 3
USE_CROSS_ENCODER = False

app = Flask(__name__)
# Enable CORS (Which allows the frontend to send requests to this server)
CORS(app)

if USE_CROSS_ENCODER:
    # Initialize and use the reranker with CrossEncoder
    ranker = CourseReranker()
else:
    # Initialize and use the reranker with precomputed embeddings
    ranker = CourseRerankerWithFieldMapping(embeddings_file='./data/precomputed_field_embeddings.pt')

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


    retry = 0

    courses_df = pd.read_csv('./data/courses.csv')
    scored_courses_df = None
    query_for_retrival = None
    ranked_course_ids = courses_df['id'].tolist()

    while retry < MAX_RETRY:
        # Generate query for retrieval
        print('=== Convert Conversation to Query ===')
        query_for_retrival = generate_potential_query(messages)
        print("=====================")

        # Get retrieval result
        print('=== Retrieval ===')
        scored_courses_df = ranker.score_courses(query_for_retrival, courses_df)
        print("=====================")

        ranked_course_ids: List[str] = scored_courses_df['id'].tolist()

        # Break if response is satisfactory
        # TODO: Add more conditions for check performance
        break

    # Argument generation
    print('=== Generate Arguments ===')
    final_response = generate_final_response(scored_courses_df, query_for_retrival)
    print("=====================")

    # Build the response payload
    response: ChatResponse = ChatResponse(response=final_response['response'], ranked_course_ids=ranked_course_ids)

    return jsonify(response.to_dict())

if __name__ == '__main__':
    app.run(debug=True)
