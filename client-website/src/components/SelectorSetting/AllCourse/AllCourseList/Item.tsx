import { Component } from 'react';
import ReactGA from 'react-ga4';
import { Form, OverlayTrigger, Popover, Stack } from 'react-bootstrap';
import type { Placement } from 'react-bootstrap/types';

import type { Course, Weekday } from '@/types';
import {
  CourseInfo,
  CourseRow,
  SmallCourseInfo,
  StyledLink,
  StyledPopover,
  Tag,
  TinyCourseInfo,
} from '#/common/CommonStyle.tsx';

interface ItemProps {
  course: Course;
  isConflict: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isCollapsed: boolean;
  onCourseSelect: (course: Course, isSelected: boolean) => void;
  onCourseHover: (courseId: string | null) => void;
}

interface ItemState {
  showPopover: boolean;
  placement: Placement | undefined;
}

class Item extends Component<ItemProps, ItemState> {
  state = {
    showPopover: false,
    placement:
      window.innerWidth < 992 ? ('left' as Placement) : ('left' as Placement),
  };

  infoCells: {
    [key: string]: keyof Course;
  } = {
    名額: 'Restrict',
    點選: 'Select',
    選上: 'Selected',
    餘額: 'Remaining',
    備註: 'Context',
  };

  /**
   * 處理畫面尺寸變化
   */
  handleResize = () => {
    const newPlacement = window.innerWidth < 992 ? 'bottom' : 'left';
    this.setState({ placement: newPlacement });
  };

  /**
   * 註冊畫面尺寸變化事件
   */
  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  /**
   * 取消註冊畫面尺寸變化事件
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * 處理課程選取
   */
  handleCourseSelect = () => {
    let prev_isSelected = this.props.isSelected;
    this.props.onCourseSelect(this.props.course, !this.props.isSelected);

    // send ga4 event
    if (!prev_isSelected) {
      ReactGA.event({
        category: 'Course Select',
        action: 'Click',
        label: this.props.course.Name,
      });
    }
  };

  /**
   * 處理彈出視窗顯示
   * @param show
   */
  handleTogglePopover = (show: boolean) => {
    // Cellery: 延遲顯示彈出視窗防止閃爍
    this.setState({ showPopover: show });
  };

  /**
   * 渲染彈出視窗
   * @returns {JSX.Element}
   */
  renderPopover = () => {
    const { course } = this.props;
    return (
      <>
        <Popover.Header as='h3'>
          <span className='fw-bolder'>{course['Name']}</span> {course['Number']}
        </Popover.Header>
        <Popover.Body>
          <Stack direction='horizontal' gap={1}>
            {Object.entries(this.infoCells).map(([displayName, courseKey]) => (
              <Stack
                key={displayName}
                className='bg-body-secondary p-1 rounded-2 text-center w-50'
              >
                <div className='fw-bolder'>{displayName}</div>
                <div>{course[courseKey]}</div>
              </Stack>
            ))}
          </Stack>
        </Popover.Body>
      </>
    );
  };

  render() {
    const {
      course,
      isConflict,
      isSelected,
      isHovered,
      onCourseHover,
      isCollapsed,
    } = this.props;
    const { showPopover, placement } = this.state;

    if (!course) return null;

    // 處理時間欄位，改成繁體中文
    const days = {
      Monday: '一',
      Tuesday: '二',
      Wednesday: '三',
      Thursday: '四',
      Friday: '五',
      Saturday: '六',
      Sunday: '日',
    };
    const time = (Object.keys(days) as Weekday[])
      .map((day) =>
        course[day] ? (
          <Tag key={day}>
            {days[day]} {course[day]}
          </Tag>
        ) : null,
      )
      .filter((tag) => tag !== null);

    // 處理可能有多個教授的情況
    const teachers = course['Teacher'].split(',').map((teacher, index) => {
      const teacherName = teacher.trim().replace("'", '');
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`中山大學 ${teacherName} DCard | PTT`)}`;
      return (
        <Tag key={index}>
          <StyledLink
            href={searchUrl}
            target='_blank'
            rel='noopener noreferrer'
          >
            {teacherName}
          </StyledLink>
        </Tag>
      );
    });

    // 處理可能有多個學程的情況
    const programs = course['Programs'] ? (
      course['Programs']
        .split(',')
        // whats2000: 去除重複的學程
        .filter((program, index, self) => self.indexOf(program) === index)
        .map((program) => (
          <Tag key={program}>{program.trim().replace("'", '')}</Tag>
        ))
    ) : (
      <>無</>
    );

    // 處理學分顏色 0 ~ 3
    const credit = (
      <Tag
        className={
          (course['Credit'] === '0'
            ? 'bg-danger'
            : course['Credit'] === '1'
              ? 'bg-warning'
              : course['Credit'] === '2'
                ? 'bg-success'
                : course['Credit'] === '3'
                  ? 'bg-primary'
                  : 'bg-info') + ' text-white'
        }
      >
        {course['Credit']}
      </Tag>
    );

    // 處理全英課程
    const emi = (
      <Tag
        className={
          course['EMI'] === '1'
            ? 'bg-danger text-white'
            : 'bg-transparent border-0'
        }
      >
        {course['EMI'] === '1' ? '是' : '否'}
      </Tag>
    );

    // 處理必選修
    const compulsoryElective = (
      <Tag
        className={
          course['CompulsoryElective'] === '必'
            ? 'bg-danger text-white'
            : 'bg-transparent border-0'
        }
      >
        {course['CompulsoryElective']}
      </Tag>
    );

    // 處理課程連結
    const courseName = (
      <StyledLink
        href={course['Url']}
        target='_blank'
        rel='noopener noreferrer'
      >
        {course['Name']}
      </StyledLink>
    );

    // 處理課程顏色
    const classColor = {
      不分班: {
        name: '不分',
        color: 'bg-transparent border-0',
      },
      全英班: {
        name: '全英',
        color: 'bg-danger text-white',
      },
      甲班: {
        name: '甲班',
        color: 'bg-info text-white',
      },
      乙班: {
        name: '乙班',
        color: 'bg-warning text-white',
      },
    };
    // whats2000: 0 ~ 9 換成符號
    const gradeCode = '⓿❶❷❸❹❺❻❼❽❾';
    const courseClass = (
      <Tag
        className={
          classColor[course['Class']]
            ? classColor[course['Class']].color
            : 'bg-transparent border-0'
        }
      >
        {classColor[course['Class']]
          ? `${classColor[course['Class']].name} ${gradeCode[parseInt(course['Grade'])]}`
          : '缺失'}
      </Tag>
    );

    return (
      <CourseRow
        className={
          isConflict && !isSelected
            ? 'bg-warning-subtle'
            : isHovered
              ? 'bg-success-subtle'
              : ''
        }
        onMouseEnter={() => onCourseHover(course['Number'])}
        onMouseLeave={() => onCourseHover(null)}
      >
        <TinyCourseInfo>
          <OverlayTrigger
            trigger={['hover', 'focus']}
            placement={isCollapsed ? 'bottom' : placement}
            overlay={
              <StyledPopover
                id={`pop-info-${course['Name']}`}
                className={showPopover ? '' : 'd-none'}
              >
                {this.renderPopover()}
              </StyledPopover>
            }
            onToggle={(show) => this.handleTogglePopover(show)}
          >
            <Form.Check
              id={`all-course-${course['Number']}`}
              aria-label='option 1'
              checked={this.props.isSelected}
              onChange={this.handleCourseSelect}
            />
          </OverlayTrigger>
        </TinyCourseInfo>
        <CourseInfo>{courseName}</CourseInfo>
        <SmallCourseInfo>{time}</SmallCourseInfo>
        <SmallCourseInfo>{course['Department']}</SmallCourseInfo>
        <SmallCourseInfo>{compulsoryElective}</SmallCourseInfo>
        <SmallCourseInfo>{credit}</SmallCourseInfo>
        <SmallCourseInfo>{emi}</SmallCourseInfo>
        <SmallCourseInfo>{courseClass}</SmallCourseInfo>
        <SmallCourseInfo>{teachers}</SmallCourseInfo>
        <CourseInfo>{programs}</CourseInfo>
      </CourseRow>
    );
  }
}

export default Item;
