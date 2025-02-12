import React, { Component } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import {
  FileEarmarkText,
  JournalText,
  InfoCircle,
  ArrowUpCircle,
  Gear,
  ExclamationCircle,
  CodeSlash,
  Envelope,
} from 'react-bootstrap-icons';
import styled from 'styled-components';

import { ANNOUNCEMENT_DATA } from '../../config';

const TextWithIcon = styled(Card.Text)`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: bold;
  svg {
    margin: 0 8px;
  }
`;

interface AnnouncementProps {
  latestCourseHistoryData: string;
  convertVersion: (version: string) => string | React.ReactNode;
}

class Announcement extends Component<AnnouncementProps> {
  /**
   * 渲染列表
   * @param {string[]} items 列表項目
   * @returns {JSX.Element[]} 列表元素
   */
  renderList(items: React.ReactNode[]): React.ReactNode[] {
    return items.map((item, index) => <li key={index}>{item}</li>);
  }

  render() {
    const { latestCourseHistoryData, convertVersion } = this.props;
    return (
      <Card>
        <Card.Header className='text-center'>
          <Card.Title className='fw-bolder mb-0 p-2'>
            🙈中山大學選課小助手 {ANNOUNCEMENT_DATA.version}
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col lg={6} md={6}>
              <TextWithIcon>
                <JournalText /> 更新紀錄 Courses Data Status
              </TextWithIcon>
              <ul>
                <li>學期課程資料: {convertVersion(latestCourseHistoryData)}</li>
              </ul>
            </Col>
            <Col lg={6} md={6}>
              <TextWithIcon>
                <ArrowUpCircle /> 更新內容 Updates
              </TextWithIcon>
              <ul>{this.renderList(ANNOUNCEMENT_DATA.updates)}</ul>
            </Col>
            <Col lg={6} md={6}>
              <TextWithIcon>
                <InfoCircle /> 使用須知
              </TextWithIcon>
              <ul>{this.renderList(ANNOUNCEMENT_DATA.description)}</ul>
            </Col>
            <Col lg={6} md={6}>
              <TextWithIcon>
                <FileEarmarkText /> 相關連結 Urls
              </TextWithIcon>
              <ul>
                <li>
                  回饋表單 Feedback: <br />
                  <a
                    href={ANNOUNCEMENT_DATA.feedbackFormUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    {ANNOUNCEMENT_DATA.feedbackFormUrl}
                  </a>
                </li>
                <li>
                  選課論壇 Discord Forum: <br />
                  <a
                    href={ANNOUNCEMENT_DATA.DCForumUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    {ANNOUNCEMENT_DATA.DCForumUrl}
                  </a>
                </li>
              </ul>
            </Col>
            <Col lg={6} md={6}>
              <TextWithIcon>
                <Gear /> 主要功能 Main Features
              </TextWithIcon>
              <ul>{this.renderList(ANNOUNCEMENT_DATA.features)}</ul>
            </Col>
            <Col lg={6} md={6}>
              <TextWithIcon>
                <ExclamationCircle /> 已知問題 Known Issues
              </TextWithIcon>
              <ul>{this.renderList(ANNOUNCEMENT_DATA.knownIssues)}</ul>
            </Col>
            <Col lg={6} md={6}>
              <TextWithIcon>
                <CodeSlash /> 專案程式 Source Code
              </TextWithIcon>
              <ul>
                <li>
                  <a
                    href={ANNOUNCEMENT_DATA.githubUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    Github
                  </a>
                </li>
              </ul>
            </Col>
            <Col lg={6} md={6}>
              <TextWithIcon>
                <Envelope /> 錯誤回報 & 聯絡 Reporting Issue
              </TextWithIcon>
              <ul>
                <li>
                  總負責人：
                  <a href={`mailto:${ANNOUNCEMENT_DATA.contactEmail}`}>
                    {ANNOUNCEMENT_DATA.contactEmail}
                  </a>
                </li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer className='text-center text-muted fst-italic fw-light'>
          <Card.Text className='text-center'>
            {ANNOUNCEMENT_DATA.termsofuse[0]}
          </Card.Text>
          <Card.Text className='text-center'>
            {ANNOUNCEMENT_DATA.copyright.map((text) => {
              return (
                <small key={text}>
                  {text}
                  <br />
                </small>
              );
            })}
          </Card.Text>
        </Card.Footer>
      </Card>
    );
  }
}

export default Announcement;
