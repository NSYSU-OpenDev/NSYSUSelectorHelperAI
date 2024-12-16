import json
import os
from typing import List, Dict

from dotenv import load_dotenv
from groq import Groq

from backend.types.chat_types import Message

# Load environment variables
load_dotenv()


def convert_messages_to_groq_format(messages: List[Message]) -> List[dict]:
    """
    Convert a Message list to Groq API message format
    """
    return [{"role": msg.role, "content": msg.content} for msg in messages]


def read_system_prompt(file_path: str = './prompt.txt') -> str:
    """
    Read system prompt from a file
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            return content
    except FileNotFoundError:
        print("Warning: Prompt file not found. Using default prompt.")
        return """
        You are a course query assistant. Follow these steps:
        1. Extract key information from the query
        2. Output the query in a structured format
        """

"""
Available models:
- gemma2-9b-it
- llama-3.1-8b-instant
- llama-3.1-70b-versatile
- llama-3.2-3b-preview
- llama-3.3-70b-versatile
"""
def generate_potential_query(messages: List[Message], model: str = "llama-3.3-70b-versatile") -> Dict[str, str]:
    """
    Convert dialog to potential query using Groq
    """
    # Get API Key
    api_key = os.getenv('GROQ_API_KEY')

    if not api_key or api_key == 'YOUR_GROQ_API_KEY_HERE':
        print("Warning: No valid API Key")
        return {"name": "course recommendation"}

    # Read system prompt
    system_prompt = read_system_prompt()

    # Initialize Groq client
    client = Groq(api_key=api_key)

    # Convert messages to Groq format
    groq_messages = convert_messages_to_groq_format(messages)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                *groq_messages
            ],
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "course_query",
                        "description": "Search and retrieve course information based on specified parameters. You must select at least one parameter.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "teacher": {
                                    "type": "string",
                                    "description": "Name of the course teacher or instructor. Provide the name if the course has a specific instructor."
                                },
                                "course_name": {
                                    "type": "string",
                                    "description": "Name or keyword for the course (excluding teacher's name).",
                                    "default": "course recommendation"
                                },
                                "department": {
                                    "type": "string",
                                    "description": "Department offering the course."
                                },
                                "program": {
                                    "type": "string",
                                    "description": "Academic program to which the course belongs."
                                },
                                "grade": {
                                    "type": "number",
                                    "description": "Targeted grade or year of students for the course."
                                },
                                "deliveryMode": {
                                    "type": "string",
                                    "description": "Format of course delivery. Options: [online, offline, hybrid]."
                                }
                            },
                            "required": []
                        }
                    }
                }
            ],
            tool_choice="required",
            max_tokens=4096,
        )

        # Safely extract tool calls
        tool_calls = response.choices[0].message.tool_calls

        if tool_calls:
            query_data = tool_calls[0].function.arguments
            print(f"Generated query: {query_data}")
            return json.loads(query_data)
        else:
            # Fallback if no tool calls
            default_query = {"name": messages[-1].content if messages else "course recommendation"}
            print(f"No tool calls, using default query: {default_query}")
            return default_query

    except Exception as e:
        print(f"Query generation error: {str(e)}")
        return {"name": messages[-1].content if messages else "course recommendation"}


def test_query_generator():
    """
    Run test cases for query generation
    """
    test_cases = [
        [
            Message(role="user", content="我想學機器學習"),
            Message(role="assistant", content="你對哪方面感興趣？"),
            Message(role="user", content="特別對深度學習和電腦視覺感興趣")
        ],
        [
            Message(role="user", content="羅珮綺老師有什麼課"),
        ],
        [
            Message(role="user", content="大四資管有什麼課"),
        ]
    ]

    for idx, test_messages in enumerate(test_cases, 1):
        print(f"\nTest Case {idx}:")
        print(f"Conversation: {[msg.content for msg in test_messages]}")
        query = generate_potential_query(test_messages)
        print(query)
        print("-" * 50)


if __name__ == "__main__":
    test_query_generator()
