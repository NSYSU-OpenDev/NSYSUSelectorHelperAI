import React, { Component } from 'react';
import { Modal, Button, Form, Card } from 'react-bootstrap';
import {
  Megaphone,
  FileEarmarkText,
  ArrowUpCircle,
} from 'react-bootstrap-icons';
import styled from 'styled-components';

import { ENTRY_NOTIFICATION_CONFIG, WEBSITE_COLOR } from '../config';

const TextWithIcon = styled(Card.Text)`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: bold;

  svg {
    margin: 0 8px;
  }
`;

const FillFormButton = styled(Button)`
  background-color: ${WEBSITE_COLOR.mainColor};
  border-color: ${WEBSITE_COLOR.mainColor};

  &:hover,
  &:focus {
    background-color: ${WEBSITE_COLOR.mainDarkerColor};
    border-color: ${WEBSITE_COLOR.mainDarkerColor};
  }

  a {
    color: white;
    text-decoration: none;
  }
`;

class EntryNotification extends Component {
  state = {
    show: false,
  };

  componentDidMount() {
    const announcementSeen = localStorage.getItem('entryNotificationSeen');
    const versionSeen = localStorage.getItem('entryNotificationVersion');

    if (
      announcementSeen !== 'true' ||
      versionSeen !== ENTRY_NOTIFICATION_CONFIG.version
    ) {
      this.setState({ show: true });
    }
  }

  /**
   * 渲染列表
   * @param items {(string | React.ReactNode)[]} 列表項目
   * @returns {React.ReactNode} 列表元素
   */
  renderList(items: (string | React.ReactNode)[]): React.ReactNode {
    return items.map((item, index) => <li key={index}>{item}</li>);
  }

  /**
   * 關閉 Modal
   */
  handleClose = () => {
    this.setState({ show: false });
  };

  /**
   * 處理「不再顯示」的事件
   * @param event {Event} 事件
   */
  handleDontShowAgain = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    localStorage.setItem('entryNotificationSeen', checked ? 'true' : 'false');
    localStorage.setItem(
      'entryNotificationVersion',
      ENTRY_NOTIFICATION_CONFIG.version,
    );
  };

  render() {
    return (
      <Modal show={this.state.show} onHide={this.handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <TextWithIcon>
              <Megaphone />
              公告
            </TextWithIcon>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{ENTRY_NOTIFICATION_CONFIG.description}</p>

          <TextWithIcon>
            <ArrowUpCircle /> 更新內容 Updates：
          </TextWithIcon>
          <ul>{this.renderList(ENTRY_NOTIFICATION_CONFIG.updates)}</ul>

          <TextWithIcon>
            <FileEarmarkText /> 回饋表單 Feedback：
          </TextWithIcon>
          <ul>
            <li>
              <a
                href={ENTRY_NOTIFICATION_CONFIG.feedbackFormUrl}
                target='_blank'
                rel='noreferrer'
              >
                {ENTRY_NOTIFICATION_CONFIG.feedbackFormUrl}
              </a>
            </li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Form.Check
            id='dont-show-again'
            type='checkbox'
            label='不再顯示'
            onChange={this.handleDontShowAgain}
          />
          <Button variant='secondary' onClick={this.handleClose}>
            關閉
          </Button>
          <FillFormButton>
            <a
              href={ENTRY_NOTIFICATION_CONFIG.feedbackFormUrl}
              target='_blank'
              rel='noreferrer'
            >
              填寫回饋表單
            </a>
          </FillFormButton>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default EntryNotification;
