import React, { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import styled, { css } from 'styled-components';
import Markdown from 'react-markdown';

import type { Message, ChatRequest, Course } from '@/types';
import { ASSISTANT_API_URL, WEBSITE_COLOR } from '@/config.tsx';
import ChatApiConnector from '@/api/ChatApiConnector';
import { StyledButton } from '#/common/CommonStyle.tsx';

const ChatContainer = styled.div`
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  height: 460px;
`;

const ChatBubble = styled.div<{ role: string }>`
  margin: 5px 20px;
  border-radius: 15px;
  max-width: 80%;
  padding: 20px 8px 8px;
  ${(props) =>
    props.role === 'user'
      ? css`
          background-color: ${WEBSITE_COLOR.mainColor};
          color: white;
          align-self: flex-end;
          margin-left: auto;
        `
      : css`
          background-color: #e2e2e2;
          color: black;
          align-self: flex-start;
          margin-right: auto;
        `}
`;

const apiConnector = new ChatApiConnector(ASSISTANT_API_URL);

interface ChatSliderProps {
  selectedSemester: string;
  courses: Course[];
  updateNewOrderedCourses: (newOrderedCourses: Course[]) => void;
}

export const ChatSlider: React.FC<ChatSliderProps> = ({
  selectedSemester,
  courses,
  updateNewOrderedCourses,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '您好！我是您的智慧選課助手，我能幫您快速找到適合您的課程。',
    },
  ]);

  const handleSend = async () => {
    if (!newMessage.trim()) {
      return;
    }

    const userMessage: Message = { role: 'user', content: newMessage };
    if (messages[messages.length - 1].role === 'assistant') {
      setMessages((prevMessages) => [...prevMessages, userMessage]);
    } else {
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        userMessage,
      ]);
    }
    setNewMessage('');

    const chatRequest: ChatRequest = {
      messages: [...messages, userMessage],
      currentSelectedCourseId: [],
      semesters: selectedSemester,
    };

    if (chatRequest.messages.length > 1) {
      chatRequest.messages.shift();
    }

    try {
      const response = await apiConnector.sendChatRequest(chatRequest);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      // Rerank the courses based on rankedCourseIds from the response
      if (response.rankedCourseIds && response.rankedCourseIds.length > 0) {
        const rerankedCourses: Course[] = response.rankedCourseIds
          .map((id) => courses.find((course) => course.Number === id))
          .filter((course) => course != null) as Course[];
        // Adjust if necessary to keep the number of courses the same
        const currentCoursesCount = courses.length;
        if (rerankedCourses.length < currentCoursesCount) {
          const additionalCourses = courses.filter(
            (course) => !rerankedCourses.includes(course),
          );
          rerankedCourses.push(
            ...additionalCourses.slice(
              0,
              currentCoursesCount - rerankedCourses.length,
            ),
          );
        }
        updateNewOrderedCourses(rerankedCourses);
      }
    } catch (error) {
      console.error('Error while communicating with chat API:', error);
    }
  };

  return (
    <div className='chat-slider bg-secondary-subtle p-4 rounded-lg shadow-lg'>
      <ChatContainer>
        {messages.map((msg, index) => (
          <ChatBubble key={index} role={msg.role}>
            <strong>{msg.role === 'user' ? '您:' : 'AI選課助手:'}</strong>{' '}
            <Markdown>{msg.content}</Markdown>
          </ChatBubble>
        ))}
      </ChatContainer>

      <InputGroup>
        <Form.Control
          type='text'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder='說些你喜歡的事務，或是你想學習的技能吧！'
        />
        <StyledButton onClick={handleSend}>Send</StyledButton>
      </InputGroup>
    </div>
  );
};
