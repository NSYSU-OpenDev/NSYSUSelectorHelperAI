from typing import List, Dict


class Message:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

    @staticmethod
    def from_dict(data: Dict) -> 'Message':
        return Message(role=data['role'], content=data['content'])

    def to_dict(self) -> Dict:
        return {
            'role': self.role,
            'content': self.content
        }

    def __str__(self):
        return f"Message(role={self.role}, content={self.content})"


class ChatRequest:
    def __init__(self, messages: List[Message], semesters: str, current_selected_course_id: List[str]):
        self.messages = messages
        self.semesters = semesters
        self.currentSelectedCourseId = current_selected_course_id

    @staticmethod
    def from_dict(data: Dict) -> 'ChatRequest':
        messages = [Message.from_dict(msg) for msg in data['messages']]
        return ChatRequest(messages=messages, semesters=data['semesters'],
                           current_selected_course_id=data['currentSelectedCourseId'])

    def to_dict(self) -> Dict:
        return {
            'messages': [message.to_dict() for message in self.messages],
            'semesters': self.semesters,
            'currentSelectedCourseId': self.currentSelectedCourseId
        }

    def __str__(self):
        return f"ChatRequest(messages={self.messages}, semesters={self.semesters}, currentSelectedCourseId={self.currentSelectedCourseId})"


class ChatResponse:
    def __init__(self, response: str, ranked_course_ids: List[str]):
        self.response = response
        self.rankedCourseIds = ranked_course_ids

    @staticmethod
    def from_dict(data: Dict) -> 'ChatResponse':
        return ChatResponse(response=data['response'], ranked_course_ids=data['ranked_course_ids'])

    def to_dict(self) -> Dict:
        return {
            'response': self.response,
            'rankedCourseIds': self.rankedCourseIds
        }

    def __str__(self):
        return f"ChatResponse(response={self.response}, ranked_course_ids={self.rankedCourseIds})"