import styled from 'styled-components';
import { Button, Popover } from 'react-bootstrap';
import { WEBSITE_COLOR } from '@/config.tsx';

export const CourseRow = styled.div`
  font-size: 12px;
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  background-color: #fafafa;

  &:hover {
    background-color: #f0f0f0;
  }
`;

export const CourseInfo = styled.div`
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: fade;
  font-size: 0.8rem;

  &:last-child {
    margin-right: 0;
  }
`;

export const SmallCourseInfo = styled(CourseInfo)`
  flex: 0.4;
`;

export const TinyCourseInfo = styled(CourseInfo)`
  flex: 0.25;
`;

export const Tag = styled.div`
  background-color: #eef;
  border: 1px solid #ddf;
  border-radius: 4px;
  padding: 2px 5px;
  margin: 2px;
  font-size: 0.7rem;
  font-weight: bold;
`;

export const StyledLink = styled.a`
  display: inline-block;
  text-decoration: none;
  color: black;

  &:hover {
    text-decoration: underline;
  }
`;

export const StyledPopover = styled(Popover)`
  &.popover {
    // whats2000: 正式修正彈出視窗位置抖動問題
    position: fixed;
    max-width: 400px;
  }
`;

export const StyledButton = styled(Button)`
  background-color: ${WEBSITE_COLOR.mainColor};
  border-color: ${WEBSITE_COLOR.mainColor};
  display: flex;
  align-items: center;

  &:hover {
    background-color: ${WEBSITE_COLOR.mainDarkerColor};
    border-color: ${WEBSITE_COLOR.mainDarkerColor};
  }
`;
