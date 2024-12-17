import os
from typing import Dict, Any

import pandas as pd
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()


def get_column_display_name(column: str) -> str:
    """
    Map column names to more readable display names.

    Args:
        column (str): Original column name

    Returns:
        str: Human-readable display name
    """
    column_mapping = {
        'name': '課程名稱',
        'id': '課程代碼',
        'department': '開課系所',
        'grade': '年級',
        'credit': '學分',
        'teacher': '授課教師',
        'compulsory': '課程類型',
        'remaining': '剩餘名額',
        'description': '課程描述',
        'syllabus': '課程大綱',
        'objectives': '課程目標',
        'tags': '學程'
    }

    return column_mapping.get(column, column)


def format_prompt(data: pd.DataFrame, query_dict: Dict[str, str], max_columns: int = 5) -> str:
    """
    Dynamically format the prompt with relevant information from the DataFrame.

    Args:
        data (pd.DataFrame): DataFrame containing course information
        query_dict (Dict[str, str]): Query parameters used for filtering
        max_columns (int): Maximum number of columns to display

    Returns:
        str: Dynamically formatted prompt in a markdown-like structure
    """
    # Cut down the number of columns to display
    data = data.head(max_columns)

    # Format query details
    query_details = "### 查詢條件\n"
    for key, value in query_dict.items():
        query_details += f"- **{key}**: {value}\n"

    # Determine key columns dynamically
    key_columns = [
        'name', 'id', 'department', 'grade', 'credit',
        'teacher', 'compulsory', 'remaining', 'description',
        'syllabus', 'objectives', 'tags'
    ]

    # Ensure these columns exist, use those that do
    available_columns = [col for col in key_columns if col in data.columns]

    # Format course information
    course_details = "### 課程資訊\n"
    for _, course in data.iterrows():
        course_details += "#### 課程詳細資訊\n"

        for col in available_columns:
            # Handle different column types and formats
            value = course.get(col, '無')

            # Special handling for specific columns
            if col == 'compulsory':
                value = '必修' if value else '選修'
            
            # Convert complex types to string representation
            if isinstance(value, (list, dict)):
                value = str(value)
            
            # Truncate very long strings
            if isinstance(value, str) and len(value) > 200:
                value = value[:200] + '...'

            # Add column to output
            course_details += f"- **{get_column_display_name(col)}**: {value}\n"

        # Add any additional dynamic columns not in the predefined list
        additional_columns = set(course.index) - set(available_columns)
        if additional_columns:
            course_details += "\n#### 其他資訊\n"
            for col in additional_columns:
                value = course[col]
                
                # Skip empty or None values
                try:
                    # Handle different types of emptiness
                    if pd.isna(value) or (isinstance(value, str) and value.strip() == ''):
                        continue
                except:
                    # Fallback for complex types
                    if value is None:
                        continue

                # Convert complex types to string
                if isinstance(value, (list, dict)):
                    value = str(value)
                
                # Truncate very long strings
                if isinstance(value, str) and len(value) > 200:
                    value = value[:200] + '...'

                course_details += f"- **{col}**: {value}\n"

        course_details += "\n"

    # Combine query and course details
    full_prompt = f"{query_details}\n{course_details}"

    return full_prompt


def connect_to_groq(api_key: str, prompt: str) -> Dict[str, Any]:
    """
    Connect to Groq and get a response based on the provided prompt.
    """
    # Initialize Groq client
    client = Groq(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content":
                        "你是一位智能課程推薦助手。根據用戶提供的查詢與數據，生成必要且精確的課程建議。  "
                        "若資訊不足，請提出具體的後續問題，確保結果更符合用戶需求。  "
                        "回應應簡潔明瞭，避免冗餘內容。"
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096,
        )

        generated_response = response.choices[0].message.content

        return {
            "response": generated_response if generated_response else "No response generated"
        }

    except Exception as e:
        print(f"Error connecting to Groq: {str(e)}")
        return {"error": str(e)}


def generate_final_response(data: pd.DataFrame, query_dict: Dict[str, str]) -> Dict[str, str]:
    """
    Generate the final response using the Groq API.
    """
    # Get API Key
    api_key = os.getenv('GROQ_API_KEY')

    if not api_key or api_key == 'YOUR_GROQ_API_KEY_HERE':
        print("Warning: No valid API Key")
        return {"error": "Invalid API Key"}

    # Format the prompt
    prompt = format_prompt(data, query_dict)

    # Connect to Groq and generate response
    return connect_to_groq(api_key, prompt)


# For self-testing below is an example of how you might call this function
if __name__ == "__main__":
    # Sample data
    df = pd.DataFrame([
        {
            "url": "https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?SYEAR=113&SEM=1&CrsDat=IM101&Crsname=資訊管理概論",
            "change": "無變化",
            "changeDescription": "",
            "multipleCompulsory": False,
            "department": "資管",
            "id": "IM101",
            "grade": "4",
            "class": "甲班",
            "name": "資訊管理概論\nINTRODUCTION TO INFORMATION MANAGEMENT",
            "credit": "3",
            "yearSemester": "上學期",
            "compulsory": True,
            "restrict": 60,
            "select": 45,
            "selected": 45,
            "remaining": 15,
            "teacher": "李四",
            "room": "三7,8(資管館101)",
            "classTime": [
                "",
                "78",
                "",
                "",
                "",
                "",
                ""
            ],
            "description": "《講授類》\n本課程介紹資訊管理的基本概念",
            "tags": ["核心課程"],
            "english": False
        },
        {
            "url": "https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?SYEAR=113&SEM=1&CrsDat=IM102&Crsname=數據分析",
            "change": "新增",
            "changeDescription": "8/20",
            "multipleCompulsory": False,
            "department": "資管",
            "id": "IM102",
            "grade": "4",
            "class": "乙班",
            "name": "數據分析\nDATA ANALYSIS",
            "credit": "3",
            "yearSemester": "上學期",
            "compulsory": False,
            "restrict": 50,
            "select": 30,
            "selected": 30,
            "remaining": 20,
            "teacher": "王五",
            "room": "四2,3(數學館203)",
            "classTime": [
                "",
                "",
                "23",
                "",
                "",
                "",
                ""
            ],
            "description": "《實作類》\n本課程著重於數據分析技術的實作。",
            "tags": ["選修課"],
            "english": False
        },
        # Additional courses can be added here
    ])
    test_query_dict = {'department': '資管', 'grade': 4}

    # Generating a response
    test_response = generate_final_response(df, test_query_dict)
    print(test_response)
