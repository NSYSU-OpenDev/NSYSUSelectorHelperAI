from typing import List

class Message:
    role: str  # 'user' 或 'assistant'
    content: str  # 訊息內容

class ChatRequest:
    messages: List[Message]  # 訊息的列表
    semesters: str  # 學期
    currentSelectedCourseId: List[str]  # 現在選取的課程 ID 列表
