export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 請求檢索課程
 * @property {Message[]} messages - 對話訊息
 * @property {string} semesters - 學期
 * @property {string[]} currentSelectedCourseId - 目前選取的課程 ID (幫助助理了解使用者可能喜歡的課程)
 */
export interface ChatRequest {
  messages: Message[];
  semesters: string;
  currentSelectedCourseId: string[];
}

/**
 * 回應檢索課程
 * @property {string} response - 回應
 * @property {string[]} rankedCourseIds - 排名後的課程ID
 */
export interface ChatResponse {
  response: string;
  rankedCourseIds: string[];
}
