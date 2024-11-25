from flask import Flask, request, jsonify

app = Flask(__name__)

# This would be your handler to process the chat requests
@app.route('/chat', methods=['POST'])
def chat():
    # Get the request data
    data = request.json

    # Extract the necessary information from the request
    messages = data.get('messages', [])
    semesters = data.get('semesters', '')
    current_selected_course_ids = data.get('currentSelectedCourseId', [])

    # Example response logic
    response_message = "This is a simulated response from the server."
    # You would typically run your logic here to process the messages and rank courses

    # Simulate ranked course ids
    ranked_course_ids = ["course123", "course456"]  # Example course IDs

    # Construct the response
    response = {
        'response': response_message,
        'rankedCourseIds': ranked_course_ids,
    }

    return jsonify(response)

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)
