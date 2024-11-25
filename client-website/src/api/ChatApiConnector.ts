import axios from 'axios';
import { ChatRequest, ChatResponse } from '@/types/ChatMessage';

class ChatApiConnector {
  private readonly baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  public async sendChatRequest(
    chatRequest: ChatRequest,
  ): Promise<ChatResponse> {
    try {
      const response = await axios.post<ChatResponse>(
        `${this.baseURL}/chat`,
        chatRequest,
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error sending chat request with data:',
        chatRequest,
        error,
      );
      throw error;
    }
  }
}

export default ChatApiConnector;
