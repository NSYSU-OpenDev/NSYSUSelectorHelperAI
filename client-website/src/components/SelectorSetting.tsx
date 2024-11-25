import React, { Component } from 'react';

import type { Course, TimeSlot } from '@/types';
import { COURSE_DAY_NAMES, DEFAULT_FILTER_OPTIONS } from '../config';
import AllCourse from './SelectorSetting/AllCourse';
import RequiredCourse from './SelectorSetting/RequiredCourse';
import CourseDetective from './SelectorSetting/CourseDetective';
import Announcement from './SelectorSetting/Announcement';
import SelectedCourse from './SelectorSetting/SelectedCourse';

interface SelectorSettingProps {
  isCollapsed: boolean;
  currentTab: string;
  courses: Course[];
  selectedCourses: Set<Course>;
  hoveredCourseId: string | null;
  onCourseSelect: (course: Course, isSelected: boolean) => void;
  onClearAllSelectedCourses: () => void;
  onCourseHover: (courseId: string | null) => void;
  latestCourseHistoryData: string;
  convertVersion: (version: string) => string | React.ReactNode;
  searchTimeSlot: TimeSlot[];
  clickedCourseId: string | null;
}

interface SelectorSettingState {
  filterOptions: typeof DEFAULT_FILTER_OPTIONS;
}

class SelectorSetting extends Component<
  SelectorSettingProps,
  SelectorSettingState
> {
  state = {
    filterOptions: DEFAULT_FILTER_OPTIONS,
  };

  componentDidMount() {
    this.calculateFilterOptions(this.props.courses);
  }

  componentDidUpdate(prevProps: SelectorSettingProps) {
    if (prevProps.courses !== this.props.courses) {
      this.calculateFilterOptions(this.props.courses);
    }
  }

  /**
   * 計算篩選選項
   * @param courses {Course[]} 課程列表
   */
  calculateFilterOptions = (courses: Course[]) => {
    let updateFilterOptions = {
      系所: new Set<string>(),
      學分: new Set<string>(),
    };

    courses?.forEach((course) => {
      updateFilterOptions['系所'].add(course['Department']);
      updateFilterOptions['學分'].add(course['Credit'].toString());
    });

    // 更新狀態
    this.setState((prevState) => ({
      filterOptions: {
        ...prevState.filterOptions,
        系所: {
          dropdown: prevState.filterOptions['系所'].dropdown,
          options: Array.from(updateFilterOptions['系所']).sort(),
        },
        學分: {
          dropdown: prevState.filterOptions['學分'].dropdown,
          options: Array.from(updateFilterOptions['學分']).sort(),
        },
      },
    }));
  };

  /**
   * 檢測時間衝突
   * @param course {Object} 要檢測的課程
   * @param selectedCourses {Set} 已選擇的課程集合
   * @returns {boolean} 如果衝突，返回 true
   */
  detectTimeConflict = (
    course: Course,
    selectedCourses: Set<Course>,
  ): boolean => {
    for (let selectedCourse of selectedCourses) {
      if (this.isConflict(course, selectedCourse)) {
        return true;
      }
    }
    return false;
  };

  /**
   * 判斷兩個課程是否衝突
   * @param course1 {Course} 第一個課程
   * @param course2 {Course} 第二個課程
   * @returns {boolean} 如果衝突，返回 true
   */
  isConflict = (course1: Course, course2: Course): boolean => {
    for (let day of COURSE_DAY_NAMES) {
      if (course1[day] && course2[day]) {
        const time1 = course1[day].split('');
        const time2 = course2[day].split('');
        if (time1.some((t) => time2.includes(t))) {
          return true;
        }
      }
    }
    return false;
  };

  render() {
    const {
      currentTab,
      courses,
      selectedCourses,
      onCourseSelect,
      onClearAllSelectedCourses,
      onCourseHover,
      hoveredCourseId,
      isCollapsed,
      latestCourseHistoryData,
      convertVersion,
      searchTimeSlot,
      clickedCourseId,
    } = this.props;
    const { filterOptions } = this.state;

    const mapTabToComponent = {
      所有課程: (
        <AllCourse
          isCollapsed={isCollapsed}
          courses={courses}
          selectedCourses={selectedCourses}
          hoveredCourseId={hoveredCourseId}
          onCourseSelect={onCourseSelect}
          onClearAllSelectedCourses={onClearAllSelectedCourses}
          onCourseHover={onCourseHover}
          filterOptions={filterOptions}
          detectTimeConflict={this.detectTimeConflict}
          clickedCourseId={clickedCourseId}
        />
      ),
      學期必修: (
        <RequiredCourse
          isCollapsed={isCollapsed}
          courses={courses}
          selectedCourses={selectedCourses}
          hoveredCourseId={hoveredCourseId}
          onCourseSelect={onCourseSelect}
          onCourseHover={onCourseHover}
          filterOptions={filterOptions}
          detectTimeConflict={this.detectTimeConflict}
          clickedCourseId={clickedCourseId}
        />
      ),
      課程偵探: (
        <CourseDetective
          isCollapsed={isCollapsed}
          courses={courses}
          selectedCourses={selectedCourses}
          hoveredCourseId={hoveredCourseId}
          onCourseSelect={onCourseSelect}
          onCourseHover={onCourseHover}
          searchTimeSlot={searchTimeSlot}
          detectTimeConflict={this.detectTimeConflict}
          clickedCourseId={clickedCourseId}
        />
      ),
      已選匯出: (
        <SelectedCourse
          isCollapsed={isCollapsed}
          courses={courses}
          hoveredCourseId={hoveredCourseId}
          onCourseSelect={onCourseSelect}
          onCourseHover={onCourseHover}
          selectedCourses={selectedCourses}
        />
      ),
      公告: (
        <Announcement
          latestCourseHistoryData={latestCourseHistoryData}
          convertVersion={convertVersion}
        />
      ),
    };

    return (
      <>
        {currentTab in mapTabToComponent ? (
          mapTabToComponent[currentTab as keyof typeof mapTabToComponent]
        ) : (
          <h1>我很確 Tab 傳遞某處出錯，請回報</h1>
        )}
      </>
    );
  }
}

export default SelectorSetting;
