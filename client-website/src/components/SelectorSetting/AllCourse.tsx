import { Component } from 'react';
import { Card, Col } from 'react-bootstrap';
import styled from 'styled-components';

import type {
  AdvancedFilterType,
  AdvancedFilterElement,
  AdvancedFilterOption,
  FilterOption,
  Course,
} from '@/types';
import {
  COURSE_DATA_NAME_MAP,
  COURSE_DAY_NAMES,
  DEFAULT_ADVANCE_FILTER,
  DEFAULT_FILTER_OPTIONS,
} from '../../config';
import CoursesList from './AllCourse/CoursesList';
import ListInformation from './AllCourse/ListInformation';

const StyledCardBody = styled(Card.Body)`
  height: 100%;
  padding: 0;

  @media (max-width: 992px) {
    min-height: 65vh;
  }
`;

interface AllCourseProps {
  courses: Course[];
  selectedCourses: Set<Course>;
  onCourseSelect: (course: Course, isSelected: boolean) => void;
  onClearAllSelectedCourses: () => void;
  onCourseHover: (courseId: string | null) => void;
  hoveredCourseId: string | null;
  filterOptions: typeof DEFAULT_FILTER_OPTIONS;
  isCollapsed: boolean;
  detectTimeConflict: (course: Course, selectedCourses: Set<Course>) => boolean;
  clickedCourseId: string | null;
}

interface AllCourseState {
  basicFilter: string;
  advancedFilters: AdvancedFilterType;
  displaySelectedOnly: boolean;
  displayConflictCourses: boolean;
  filteredCourses: Course[];
}

class AllCourse extends Component<AllCourseProps, AllCourseState> {
  state = {
    basicFilter: '',
    advancedFilters: DEFAULT_ADVANCE_FILTER,
    displaySelectedOnly: false,
    displayConflictCourses: true,
    filteredCourses: this.props.courses,
  };

  componentDidMount() {
    const savedBasicFilter = localStorage.getItem('basicFilter');
    const savedAdvancedFilters = localStorage.getItem('advancedFilters-v5.0.1');

    if (savedBasicFilter || savedAdvancedFilters) {
      this.setState({
        basicFilter: savedBasicFilter || '',
        advancedFilters: savedAdvancedFilters
          ? JSON.parse(savedAdvancedFilters)
          : {},
        filteredCourses: this.getFilteredCourses(),
      });
    }
  }

  componentDidUpdate(prevProps: AllCourseProps, prevState: AllCourseState) {
    if (
      this.state.basicFilter !== prevState.basicFilter ||
      this.state.advancedFilters !== prevState.advancedFilters ||
      this.state.displayConflictCourses !== prevState.displayConflictCourses ||
      this.props.selectedCourses !== prevProps.selectedCourses
    ) {
      localStorage.setItem('basicFilter', this.state.basicFilter);
      localStorage.setItem(
        'advancedFilters-v5.0.1',
        JSON.stringify(this.state.advancedFilters),
      );

      const filteredCourses = this.getFilteredCourses();
      this.setState({ filteredCourses });
    }
  }

  /**
   * 處理基本篩選事件
   * @param filter {string} 篩選字串
   */
  handleBasicFilterChange = (filter: string) => {
    this.setState({ basicFilter: filter });
  };

  /**
   * 處理進階篩選事件
   */
  handleAdvancedFilterChange = (advancedFilters: AdvancedFilterType) => {
    this.setState({ advancedFilters });
  };

  /**
   * 獲取過濾後的課程列表
   * @returns {Array} 過濾後的課程列表
   */
  getFilteredCourses = (): Course[] => {
    const { courses } = this.props;
    const { basicFilter, displayConflictCourses, advancedFilters } = this.state;

    let filteredCourses = courses;

    // 如果有基本篩選字串，則過濾掉不包含該字串的課程
    if (basicFilter) {
      const filterKeywords = basicFilter.toLowerCase().split(/\s+/);

      filteredCourses = filteredCourses.filter((course) =>
        filterKeywords.every(
          (keyword) =>
            course['Name'].toLowerCase().includes(keyword) ||
            course['Teacher'].toLowerCase().includes(keyword) ||
            course['Programs'].toLowerCase().includes(keyword) ||
            course['Number'].toLowerCase().includes(keyword) ||
            course['Department'].toLowerCase().includes(keyword),
        ),
      );
    }

    filteredCourses = this.applyAdvancedFilters(
      filteredCourses,
      advancedFilters,
    );

    // 如果不顯示衝堂課程，則過濾掉衝堂課程
    if (!displayConflictCourses) {
      filteredCourses = this.filterOutConflictCourses(filteredCourses);
    }

    return filteredCourses;
  };

  /**
   * 獲取進階過濾後的課程列表
   * @param courses {Course[]} 課程列表
   * @param advancedFilters {AdvancedFilterType} 進階篩選器
   * @returns {Course[]} 過濾後的課程列表
   */
  applyAdvancedFilters = (
    courses: Course[],
    advancedFilters: AdvancedFilterType,
  ): Course[] => {
    return courses.filter((course) => {
      return (
        Object.entries(advancedFilters) as [
          AdvancedFilterOption,
          AdvancedFilterElement,
        ][]
      ).every(([filterName, filter]) => {
        // 文字篩選器：只要有文字，就進行篩選
        if (
          filter.value !== undefined &&
          filter.value !== '' &&
          filterName !== '星期' &&
          filterName !== '節次'
        ) {
          return this.applyTextFilter(course, filterName, filter);
        }

        // 如果篩選器激活，則進行篩選
        if (filter.active) {
          // 星期或節次篩選器
          if (filterName === '星期' || filterName === '節次') {
            return this.applyTimeFilter(course, filterName, filter);
          } else {
            return this.applyOptionFilter(course, filterName, filter);
          }
        }

        // 如果篩選器未激活，則不進行篩選
        return true;
      });
    });
  };

  /**
   * 用匹配文字篩選課程
   * @param course {Course} 課程
   * @param filterName {string} 篩選器名稱
   * @param filter {FilterOption} 篩選器
   * @returns {boolean} 如果匹配，返回 true
   */
  applyTextFilter = (
    course: Course,
    filterName: FilterOption,
    filter: AdvancedFilterElement,
  ): boolean => {
    const courseValue = course[COURSE_DATA_NAME_MAP[filterName]]?.toLowerCase();
    const filterLogic =
      filter.filterLogic === undefined ? 'include' : filter.filterLogic; // equal, include, exclude
    // 使用逗號或空格分割每個組
    const filterGroups: string[] = filter.value.toLowerCase().split(/[，,]/);

    return filterGroups.some((group) => {
      // 使用空格分割每個關鍵字
      const keywords = group.trim().split(/\s+/);
      return keywords.every((keyword) => {
        if (filterLogic === 'equal') {
          return courseValue === keyword;
        }
        if (filterLogic === 'include') {
          return courseValue.includes(keyword);
        }
        if (filterLogic === 'exclude') {
          return !courseValue.includes(keyword);
        }
        return false;
      });
    });
  };

  /**
   * 用星期或節次篩選課程
   * @param course {Course} 課程
   * @param filterName {string} 篩選器名稱
   * @param filter {Object} 篩選器
   * @returns {boolean} 如果匹配，返回 true
   */
  applyTimeFilter = (
    course: Course,
    filterName: string,
    filter: AdvancedFilterElement,
  ): boolean => {
    // 檢查是否包含或排除
    const filterLogic = filter.filterLogic ?? 'include'; // equal, include, exclude

    if (filterName === '星期') {
      if (filterLogic !== 'equal') {
        // 檢查是否有任何一天匹配
        const daysMatched = COURSE_DAY_NAMES.some((day) => {
          return filter.activeOptions[day] && course[day];
        });
        return filterLogic === 'include' ? daysMatched : !daysMatched;
      } else {
        // 檢查是否有所有天匹配
        return COURSE_DAY_NAMES.every((day) => {
          return filter.activeOptions[day] === (course[day] !== '');
        });
      }
    }

    if (filterName === '節次') {
      if (filterLogic !== 'equal') {
        // 檢查是否有任何一節匹配
        let periodsMatched = false;
        COURSE_DAY_NAMES.forEach((day) => {
          if (course[day]) {
            periodsMatched =
              periodsMatched ||
              course[day].split('').some((period) => {
                return filter.activeOptions[period];
              });
          }
        });
        return filterLogic === 'include' ? periodsMatched : !periodsMatched;
      } else {
        // 檢查是否有所有節次匹配
        let periodsMatched = true;
        let filterPeriods = Object.keys(filter.activeOptions)
          .filter((period) => filter.activeOptions[period])
          .sort()
          .join('');
        // console.log(filterPeriods);
        COURSE_DAY_NAMES.forEach((day) => {
          if (course[day]) {
            periodsMatched =
              periodsMatched &&
              course[day].split('').sort().join('') === filterPeriods;
          }
        });
        return periodsMatched;
      }
    }

    throw new Error(
      'Invalid filter name at applyTimeFilter(), check the second parameter.',
    );
  };

  /**
   * 用選項篩選課程
   * @param course {Object} 課程
   * @param filterName {FilterOption} 篩選器名稱
   * @param filter {Object} 篩選器
   * @returns {boolean} 如果匹配，返回 true
   */
  applyOptionFilter = (
    course: Course,
    filterName: FilterOption,
    filter: AdvancedFilterElement,
  ): boolean => {
    // equal method is not implemented
    let isInclude = filter.filterLogic === 'include' ? 'include' : 'exclude';
    const courseValue = course[COURSE_DATA_NAME_MAP[filterName]]?.toString();
    let matched = Object.keys(filter.activeOptions).some((option) => {
      return filter.activeOptions[option] && courseValue === option;
    });
    return isInclude ? matched : !matched;
  };

  /**
   * 過濾掉時間衝突的課程
   * @param courses {Course[]} 課程列表
   * @returns {Course[]} 經過時間衝突過濾的課程列表
   */
  filterOutConflictCourses = (courses: Course[]): Course[] => {
    const { selectedCourses } = this.props;
    return courses.filter((course) => {
      // 如果課程已被選擇，則不進行衝突檢查，直接保留
      if (selectedCourses.has(course)) {
        return true;
      }
      // 否則，檢查是否有時間衝突
      return !this.props.detectTimeConflict(course, selectedCourses);
    });
  };

  /**
   * 切換只顯示已選課程
   */
  toggleOnlySelected = () => {
    this.setState({ displaySelectedOnly: !this.state.displaySelectedOnly });
  };

  /**
   * 切換是否顯示衝堂課程
   */
  toggleDisplayConflictCourses = () => {
    this.setState({
      displayConflictCourses: !this.state.displayConflictCourses,
    });
  };

  render() {
    const {
      selectedCourses,
      onCourseSelect,
      onClearAllSelectedCourses,
      onCourseHover,
      filterOptions,
      hoveredCourseId,
      isCollapsed,
      detectTimeConflict,
      clickedCourseId,
    } = this.props;
    const {
      filteredCourses,
      basicFilter,
      advancedFilters,
      displaySelectedOnly,
      displayConflictCourses,
    } = this.state;

    return (
      <Card className='h-100'>
        <Card.Header className='text-center'>
          <Card.Title className='fw-bolder mb-0 p-2'>所有課程</Card.Title>
          <Card.Subtitle className='mb-0 p-2'>
            <Col>
              共篩選 {filteredCourses.length} 門課程，已選{' '}
              {selectedCourses.size} 門課程
            </Col>
          </Card.Subtitle>
        </Card.Header>
        <ListInformation
          selectedCourses={selectedCourses}
          onClearAllSelectedCourses={onClearAllSelectedCourses}
          basicFilter={basicFilter}
          onBasicFilterChange={this.handleBasicFilterChange}
          advancedFilters={advancedFilters}
          onAdvancedFilterChange={this.handleAdvancedFilterChange}
          displaySelectedOnly={displaySelectedOnly}
          toggleOnlySelected={this.toggleOnlySelected}
          displayConflictCourses={displayConflictCourses}
          toggleDisplayConflictCourses={this.toggleDisplayConflictCourses}
          filterOptions={filterOptions}
        />
        <StyledCardBody>
          <CoursesList
            isCollapsed={isCollapsed}
            courses={
              displaySelectedOnly
                ? Array.from(selectedCourses)
                : filteredCourses
            }
            selectedCourses={selectedCourses}
            displayConflictCourses={displayConflictCourses}
            detectTimeConflict={detectTimeConflict}
            hoveredCourseId={hoveredCourseId}
            displaySelectedOnly={displaySelectedOnly}
            onCourseSelect={onCourseSelect}
            onCourseHover={onCourseHover}
            clickedCourseId={clickedCourseId}
          />
        </StyledCardBody>
      </Card>
    );
  }
}

export default AllCourse;
