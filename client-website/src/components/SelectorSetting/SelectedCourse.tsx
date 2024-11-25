import React, { Component } from 'react';
import { Card, Col } from 'react-bootstrap';
import styled from 'styled-components';
import ReactGA from 'react-ga4';

import type { Course } from '@/types';
import ListInformation from './SelectedCourse/ListInformation';
import CoursesList from './SelectedCourse/CoursesList';
import ExportModal from './SelectedCourse/ExportModal';
import HowToUseModal from './SelectedCourse/HowToUseModal';
import ImportModal from './SelectedCourse/ImportModal';

const StyledCardBody = styled(Card.Body)`
  height: 100%;
  padding: 0;

  @media (max-width: 992px) {
    min-height: 65vh;
  }
`;

interface SelectedCourseProps {
  courses: Course[];
  selectedCourses: Set<Course>;
  onCourseSelect: (course: Course, isSelected: boolean) => void;
  isCollapsed: boolean;
  hoveredCourseId: string | null;
  onCourseHover: (courseId: string | null) => void;
}

interface SelectedCourseState {
  addedSelectedCourses: Set<string>;
  courseWeight: Record<string, number>;
  showExportModal: boolean;
  showImportModal: boolean;
  showHowToUseModal: boolean;
  exportStateMessage: React.ReactNode;
  generatedCode: string;
}

class SelectedCourse extends Component<
  SelectedCourseProps,
  SelectedCourseState
> {
  state = {
    addedSelectedCourses: new Set<string>(),
    courseWeight: {},
    showExportModal: false,
    showImportModal: false,
    showHowToUseModal: false,
    exportStateMessage: '',
    generatedCode: '',
  };

  componentDidMount() {
    const savedAddedSelectedCourses = localStorage.getItem(
      'addedSelectedCourses',
    );
    const savedCourseWeight = localStorage.getItem('courseWeight');

    if (savedAddedSelectedCourses) {
      const addedSelectedCourses = new Set<string>(
        JSON.parse(savedAddedSelectedCourses || '[]'),
      );
      this.setState({ addedSelectedCourses }, () => {
        this.syncAddedSelectedCourses();
      });
    }

    if (savedCourseWeight) {
      const courseWeight = JSON.parse(savedCourseWeight);
      this.setState({ courseWeight });
    }
  }

  componentDidUpdate(prevProps: SelectedCourseProps) {
    if (prevProps.selectedCourses !== this.props.selectedCourses) {
      this.syncAddedSelectedCourses();
    }
  }

  /**
   * 同步加選課程，當已選課程發生變化時
   */
  syncAddedSelectedCourses = () => {
    const { selectedCourses } = this.props;
    const selectedCourseNumbers = new Set(
      Array.from(selectedCourses).map((course) => course['Number']),
    );

    this.setState((prevState) => {
      const addedSelectedCourses = new Set(
        [...prevState.addedSelectedCourses].filter((courseNumber) =>
          selectedCourseNumbers.has(courseNumber),
        ),
      );
      localStorage.setItem(
        'addedSelectedCourses',
        JSON.stringify(Array.from(addedSelectedCourses)),
      );
      return { addedSelectedCourses };
    });
  };

  /**
   * 處理加選課程的函數
   * @param course {Course} 課程物件
   * @param isSelected {boolean} 是否已選
   */
  handleCourseAddedSelect = (course: Course, isSelected: boolean) => {
    this.setState((prevState) => {
      const addedSelectedCourses = new Set(prevState.addedSelectedCourses);
      if (isSelected) {
        addedSelectedCourses.add(course['Number']);
      } else {
        addedSelectedCourses.delete(course['Number']);
      }
      localStorage.setItem(
        'addedSelectedCourses',
        JSON.stringify(Array.from(addedSelectedCourses)),
      );
      return { addedSelectedCourses };
    });
  };

  /**
   * 處理加選課程權重的函數
   * @param course {object} 課程物件
   * @param weight {string} 權重 0 ~ 100
   */
  handleCourseWeightChange = (course: Course, weight: string) => {
    const weightNumber =
      parseInt(weight) > 100
        ? 100
        : parseInt(weight) < 0
          ? 0
          : parseInt(weight);
    this.setState((prevState) => {
      const courseWeight = { ...prevState.courseWeight };
      courseWeight[course['Number']] = weightNumber;
      localStorage.setItem('courseWeight', JSON.stringify(courseWeight));
      return { courseWeight };
    });
  };

  /**
   * 處理匯出加選課程的函數
   */
  handleExportAddedSelectedCourses = () => {
    const { selectedCourses } = this.props;
    const { addedSelectedCourses, courseWeight } = this.state;

    // send ga4 event
    ReactGA.event({
      category: 'Export',
      action: 'Click',
      label: 'Export Added Selected Courses',
    });

    // 創建一個包含課程信息的數據結構
    const exportData = Array.from(addedSelectedCourses).map((courseNumber) => {
      const course = Array.from(selectedCourses).find(
        (c) => c['Number'] === courseNumber,
      );
      if (!course) {
        return null;
      }

      return {
        id: course['Number'],
        name: course['Name'],
        value:
          courseWeight[course['Number'] as keyof typeof courseWeight] || 50,
        isSel: '+',
      };
    });

    // 生成 javascript 腳本
    const genCode = `const frame = document.getElementById('main');
const doc = frame.contentDocument || frame.contentWindow.document;
const exportClass = ${JSON.stringify(exportData)};
try {
    exportClass.forEach((ec, i) => {
        const inputs = doc.querySelectorAll('input');
        inputs[2*i].value = ec['id'];
        inputs[2*i+1].value = ec['value'];
        doc.querySelectorAll('select')[i].value = ec['isSel'];
    });
    console.log('自動填寫: 完成');
} catch (e) {
    console.error('自動填寫: 失敗: ' + e);
}
`;

    navigator.clipboard
      .writeText(genCode)
      .then(() => {
        this.setState({
          showExportModal: true,
          exportStateMessage: (
            <p>
              成功匯出 <span className='text-danger'>{exportData.length}</span>{' '}
              個課程，腳本已複製到剪貼板
            </p>
          ),
          generatedCode: genCode,
        });
      })
      .catch(() => {
        this.setState({
          showExportModal: true,
          exportStateMessage: <p>複製失敗，請手動複製以下腳本程式</p>,
          generatedCode: genCode,
        });
      });
  };

  /**
   * 處理匯入課程的程式碼，並轉換為課程列表物件
   * @param code {string} 匯入課程的程式碼
   * @returns {boolean} 是否成功匯入
   */
  handleImportCode = (code: string): boolean => {
    const { courses, onCourseSelect } = this.props;

    try {
      // 解析 JSON 字符串
      const importCourseJson = JSON.parse(code);
      const importCourses = courses.filter((course) =>
        importCourseJson.some(
          (ec: { id: string; name: string; value: number; isSel: string }) =>
            ec['id'] === course['Number'],
        ),
      );
      importCourses.forEach((course) => {
        const importCourse = importCourseJson.find(
          (ec: { id: string; name: string; value: number; isSel: string }) =>
            ec['id'] === course['Number'],
        );
        onCourseSelect(course, true);
        this.handleCourseWeightChange(course, importCourse['value']);
      });

      return true; // 返回成功指示
    } catch (e) {
      console.error('解析錯誤: ' + e);
      return false; // 返回失敗指示
    }
  };

  /**
   * 關閉匯出 modal
   */
  closeExportModal = () => {
    this.setState({ showExportModal: false });
  };

  /**
   * 顯示匯入 modal
   */
  openImportModal = () => {
    this.setState({ showImportModal: true });
  };

  /**
   * 關閉匯入 modal
   */
  closeImportModal = () => {
    this.setState({ showImportModal: false });
  };

  /**
   * 顯示如何使用 modal
   */
  openHowToUseModal = () => {
    this.setState({ showHowToUseModal: true });
  };

  /**
   * 關閉如何使用 modal
   */
  closeHowToUseModal = () => {
    this.setState({ showHowToUseModal: false });
  };

  render() {
    const { selectedCourses, isCollapsed, hoveredCourseId, onCourseHover } =
      this.props;
    const {
      addedSelectedCourses,
      courseWeight,
      showExportModal,
      showImportModal,
      showHowToUseModal,
      exportStateMessage,
      generatedCode,
    } = this.state;

    return (
      <Card className='h-100'>
        <Card.Header className='text-center'>
          <Card.Title className='fw-bolder mb-0 p-2'>已選匯出</Card.Title>
          <Card.Subtitle className='mb-0 p-2'>
            <Col>共選 {selectedCourses.size} 門課程</Col>
            <Col className='mt-2 fst-italic text-muted'>
              選擇預加選之課程，填入點數或志願後按匯出，系統會生成腳本以供串接學校選課系統。
            </Col>
          </Card.Subtitle>
        </Card.Header>
        <ListInformation
          selectedCourses={selectedCourses}
          addedSelectedCourses={addedSelectedCourses}
          onCourseSelect={this.handleCourseAddedSelect}
          onExportCourses={this.handleExportAddedSelectedCourses}
          onImportCourses={this.openImportModal}
          onShowHowToUseModal={this.openHowToUseModal}
        />
        <StyledCardBody>
          <CoursesList
            courses={Array.from(selectedCourses.values())}
            isCollapsed={isCollapsed}
            hoveredCourseId={hoveredCourseId}
            onCourseHover={onCourseHover}
            addedSelectedCourses={addedSelectedCourses}
            onCourseSelect={this.handleCourseAddedSelect}
            courseWeight={courseWeight}
            onCourseWeightChange={this.handleCourseWeightChange}
          />
        </StyledCardBody>
        <ExportModal
          show={showExportModal}
          exportStateMessage={exportStateMessage}
          code={generatedCode}
          onHide={this.closeExportModal}
          onShowHowToUseModal={this.openHowToUseModal}
        />
        <ImportModal
          show={showImportModal}
          onHide={this.closeImportModal}
          onImportCodeSubmit={this.handleImportCode}
        />
        <HowToUseModal
          show={showHowToUseModal}
          onHide={this.closeHowToUseModal}
        />
      </Card>
    );
  }
}

export default SelectedCourse;
