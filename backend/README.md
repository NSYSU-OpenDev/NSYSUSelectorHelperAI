# API 範例文檔

這是一個簡單的 Flask 應用程式範例，提供了一個 `/chat` 端點來處理聊天請求。這段文檔提供了如何使用和測試此 API 的說明。

## 安裝與運行

### 安裝 Flask

確保你已經安裝了 Flask。如果尚未安裝，可以通過以下命令安裝：

```bash
pip install Flask
```

### 創建並運行後端應用

1. 創建一個名為 `app.py` 的檔案，將下面的程式碼複製到檔案中：

```python
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
```

2. 在終端機中進入 `backend-example` 目錄，然後使用以下命令運行應用：
   
```bash
python app.py
```

> [!NOTE]
> 請注意 Endpoint 的路徑是 `/chat`，請不要更改路徑。

### 測試 API 端點

使用 Postman 或 curl 發送 POST 請求到 `http://127.0.0.1:5000/chat`，請求的 JSON 格式應如下所示：

```json
{
    "messages": [
        {"role": "user", "content": "我想學深度學習。"},
        {"role": "assistant", "content": "請問你對哪個面向的課程感興趣？"}
        {"role": "user", "content": "我對資料檢索也有興趣。"}
    ],
    "semesters": "1131",
    "currentSelectedCourseId": []
}
```

### 請求和響應型態

- **請求 (`ChatRequest`)**:  
    - `messages`: 訊息的陣列，每個訊息的型態為 `Message`，包含以下屬性：
        - `role`: 字串，可能值為 `'user'` 或 `'assistant'`。
        - `content`: 字串，訊息內容。
    - `semesters`: 字串，代表學期的識別碼。1131代表113的第一學期。2是第二學期。3是暑期學期。
    - `currentSelectedCourseId`: 字串陣列，幫助助理了解使用者目前已經選取的課程 ID。可能為空 (尚未選取任何課程)。

- **響應 (`ChatResponse`)**:  
    - `response`: 字串，代表聊天助理的回應訊息。
    - `rankedCourseIds`: 字串陣列，經過排序的課程 ID。可以是部分也可以是全部課程 ID (若是部分課程，剩餘課程採預設排序)。若是空陣列，則代表沒有推薦的課程。

### 範例響應

API 端點將返回如下格式的響應：

```json
{
    "response": "依照你的需求，我推薦深度學習和資料檢索。",
    "rankedCourseIds": ["MIS590", "MIS583"]
}
```

### 整合前端

確保你的前端應用程式指向此 Flask 端點以進行聊天互動。記得根據實際情況修改 API 路徑。
修改位於 `config.tsx` 的 `ASSISTANT_API_URL` 變數，將其設置為後端應用程式的 URL。

> [!NOTE] 
> 請不用加上`/chat`路徑，只需填寫主機名稱即可。前端會自動加上`/chat`路徑。

```typescript
export const ASSISTANT_API_URL = 'http://THE_BACKEND_URL';
```

## 結語

這是使用 Flask 創建的一個簡單的聊天 API 範例。你可以根據需要進一步擴展此應用，添加更多功能以滿足實際需求。  
