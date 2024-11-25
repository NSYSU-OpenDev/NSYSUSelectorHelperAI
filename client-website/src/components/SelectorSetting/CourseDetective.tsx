import { Component } from 'react';
import { Card, Col } from 'react-bootstrap';
import styled from 'styled-components';

import type { Course, TimeSlot } from '@/types';
import { COURSE_DETECTIVE_ELEMENTS } from '../../config';
import CoursesList from './AllCourse/CoursesList';
import ListInformation from './CourseDetective/ListInformation';

const StyledCardBody = styled(Card.Body)`
  height: 100%;
  padding: 0;

  @media (max-width: 992px) {
    min-height: 65vh;
  }
`;

interface CourseDetectiveProps {
  courses: Course[];
  selectedCourses: Set<Course>;
  isCollapsed: boolean;
  detectTimeConflict: (course: Course, selectedCourses: Set<Course>) => boolean;
  searchTimeSlot: TimeSlot[];
  hoveredCourseId: string | null;
  onCourseSelect: (course: Course, isSelected: boolean) => void;
  onCourseHover: (courseId: string | null) => void;
  clickedCourseId: string | null;
}

interface CourseDetectiveState {
  orderElements: typeof COURSE_DETECTIVE_ELEMENTS;
  filteredCourses: Course[];
}

class CourseDetective extends Component<
  CourseDetectiveProps,
  CourseDetectiveState
> {
  state = {
    orderElements: COURSE_DETECTIVE_ELEMENTS,
    filteredCourses: [],
  };

  filterConditions = {
    'liberal-arts': (course: Course) => course.Department.startsWith('博雅'),
    'sports-fitness': (course: Course) =>
      course.Name === '運動與健康：體適能' ||
      course.Name === '運動與健康：初級游泳',
    'sports-other': (course: Course) =>
      course.Name.startsWith('運動與健康：') &&
      course.Name !== '運動與健康：體適能' &&
      course.Name !== '運動與健康：初級游泳',
    'cross-department': (course: Course) =>
      course.Department.startsWith('跨院'),
    'chinese-critical-thinking': (course: Course) =>
      course.Name.startsWith('中文思辨與表達'),
    'random-courses': (course: Course) =>
      !course.Department.includes('碩') &&
      !course.Department.includes('博') &&
      !course.Department.startsWith('博雅') &&
      !course.Name.startsWith('運動與健康：') &&
      !course.Name.startsWith('中文思辨與表達') &&
      !course.Department.startsWith('跨院') &&
      course.Name !== '英文初級' &&
      course.Name !== '英文中級' &&
      course.Name !== '英文中高級' &&
      course.Name !== '英文高級',
    'random-graduate-courses': (course: Course) =>
      (course.Department.includes('碩') || course.Department.includes('博')) &&
      !course.Department.startsWith('博雅'),
    'english-beginner': (course: Course) => course.Name === '英文初級',
    'english-intermediate': (course: Course) => course.Name === '英文中級',
    'english-advanced-mid': (course: Course) => course.Name === '英文中高級',
    'english-advanced': (course: Course) => course.Name === '英文高級',
  };

  componentDidMount() {
    const savedOrderElements = localStorage.getItem('orderElements')
      ? JSON.parse(localStorage.getItem('orderElements') || '[]')
      : null;
    if (savedOrderElements && savedOrderElements.length !== 0) {
      this.setState({ orderElements: savedOrderElements }, () => {
        this.reorderAndFilterCourses();
      });
    } else {
      this.setState({ filteredCourses: this.props.courses }, () => {
        this.reorderAndFilterCourses();
      });
    }
  }

  componentDidUpdate(prevProps: CourseDetectiveProps) {
    if (
      prevProps.courses !== this.props.courses ||
      prevProps.searchTimeSlot !== this.props.searchTimeSlot
    ) {
      this.reorderAndFilterCourses();
    }
  }

  /**
   * 設定排序元素序位
   * @param newOrderElements {Array} 新的排序元素
   */
  setOrderElements = (newOrderElements: typeof COURSE_DETECTIVE_ELEMENTS) => {
    this.setState(
      {
        orderElements: newOrderElements,
      },
      () => {
        localStorage.setItem(
          'orderElements',
          JSON.stringify(this.state.orderElements),
        );
        this.reorderAndFilterCourses();
      },
    );
  };

  /**
   * 洗牌陣列
   * @param array {Course[]} 陣列
   * @returns {Course[]} 洗牌後的陣列
   */
  shuffleArray = (array: Course[]): Course[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // 交换元素
    }
    return array;
  };

  /**
   * 重新排序並篩選課程
   */
  reorderAndFilterCourses = () => {
    const { orderElements } = this.state;
    const { courses, searchTimeSlot } = this.props;

    // Step 1: 篩選時段
    let timeSlotFilteredCourses =
      searchTimeSlot?.length > 0
        ? courses.filter((course) =>
            searchTimeSlot.some(({ weekday, timeSlot }) =>
              course[weekday]?.includes(timeSlot),
            ),
          )
        : [...courses];

    // Step 2: 基於排序元素篩選課程
    let orderedAndFilteredCourses: Course[] = [];
    let addedCourseIds = new Set();

    orderElements
      .filter((element) => element.enabled)
      .forEach((element) => {
        const id = element.id;
        if (!(id in this.filterConditions)) {
          return;
        }

        const filterCondition =
          this.filterConditions[id as keyof typeof this.filterConditions];
        if (!filterCondition) return;

        let matchingCourses = timeSlotFilteredCourses.filter(
          (course) =>
            filterCondition(course) && !addedCourseIds.has(course['Number']),
        );

        if (
          element.id === 'random-courses' ||
          element.id === 'random-graduate-courses'
        ) {
          matchingCourses = this.shuffleArray(matchingCourses);
        }

        matchingCourses.forEach((course) => {
          orderedAndFilteredCourses.push(course);
          addedCourseIds.add(course['Number']);
        });
      });

    this.setState({ filteredCourses: orderedAndFilteredCourses });
  };

  /**
   * 切換排序元素啟用狀態
   * @param id {string} 元素 id
   */
  toggleOrderElementEnable = (id: string) => {
    this.setState(
      (prevState) => ({
        orderElements: prevState.orderElements.map((element) => {
          if (element.id === id) {
            return { ...element, enabled: !element.enabled };
          }
          return element;
        }),
      }),
      () => {
        localStorage.setItem(
          'orderElements',
          JSON.stringify(this.state.orderElements),
        );
        this.reorderAndFilterCourses();
      },
    );
  };

  render() {
    const {
      selectedCourses,
      isCollapsed,
      // displayConflictCourses,
      detectTimeConflict,
      hoveredCourseId,
      onCourseSelect,
      onCourseHover,
      clickedCourseId,
    } = this.props;
    const { orderElements, filteredCourses } = this.state;
    return (
      <>
        <Card className='h-100'>
          <Card.Header className='text-center'>
            <Card.Title className='fw-bolder mb-0 p-2'>課程偵探</Card.Title>
            <Card.Subtitle className='mb-0 p-2'>
              <Col>
                共篩選 {filteredCourses.length} 門課程，已選擇{' '}
                {selectedCourses.size} 門課程
              </Col>
              <Col className='mt-2 fst-italic text-muted'>
                依照您的需求篩選並排序課程，點擊課表空白處以篩選特定時段的課程。
              </Col>
            </Card.Subtitle>
          </Card.Header>
          <ListInformation
            elements={orderElements}
            setElements={this.setOrderElements}
            selectedCourses={selectedCourses}
            toggleElementEnable={this.toggleOrderElementEnable}
          />
          <StyledCardBody>
            <CoursesList
              isCollapsed={isCollapsed}
              courses={filteredCourses}
              selectedCourses={selectedCourses}
              displayConflictCourses={true} // Cellery: restrict to true to avoid not coloring conflict courses to yellow
              detectTimeConflict={detectTimeConflict}
              hoveredCourseId={hoveredCourseId}
              onCourseSelect={onCourseSelect}
              onCourseHover={onCourseHover}
              displaySelectedOnly={false}
              clickedCourseId={clickedCourseId}
            />
          </StyledCardBody>
        </Card>
      </>
    );
  }
}

export default CourseDetective;
