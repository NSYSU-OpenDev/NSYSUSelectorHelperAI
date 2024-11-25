import React, { Component } from 'react';
import {
  Card,
  Form,
  InputGroup,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-bootstrap';
import AdvancedFilter from './ListInformation/AdvancedFilter';
import styled from 'styled-components';

import type { AdvancedFilterType, Course } from '@/types';
import { DEFAULT_FILTER_OPTIONS, WEBSITE_COLOR } from '@/config';
import { calculateTotalCreditsAndHours } from '@/utils';
import ClearSelectedCourses from './ListInformation/ClearSelectedCourses';

const ButtonsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  /* 定義活動按鈕的樣式 */

  .btn-check:checked + .btn {
    background-color: ${WEBSITE_COLOR.mainColor};
    color: white;
    border-color: ${WEBSITE_COLOR.mainColor};
  }
`;

const StyledButton = styled(ToggleButton)`
  color: ${WEBSITE_COLOR.mainColor};
  border-color: ${WEBSITE_COLOR.mainColor};

  &:focus,
  &:active:focus,
  &:not(:disabled):not(.disabled).active:focus {
    box-shadow: 0 0 0 0.2rem ${WEBSITE_COLOR.boxShadowColor};
  }
`;

interface ListInformationProps {
  selectedCourses: Set<Course>;
  basicFilter: string;
  advancedFilters: AdvancedFilterType;
  onBasicFilterChange: (value: string) => void;
  onAdvancedFilterChange: (filter: AdvancedFilterType) => void;
  onClearAllSelectedCourses: () => void;
  displaySelectedOnly: boolean;
  displayConflictCourses: boolean;
  toggleDisplayConflictCourses: () => void;
  toggleOnlySelected: () => void;
  filterOptions: typeof DEFAULT_FILTER_OPTIONS;
}

class ListInformation extends Component<ListInformationProps> {
  /**
   * 處理篩選課程名稱的事件
   * @param e {React.ChangeEvent<HTMLInputElement>} 事件
   */
  handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { onBasicFilterChange } = this.props;
    onBasicFilterChange(e.target.value);
  };

  /**
   * 處理顯示已選課程的事件
   */
  handleShowSelectedCourses = () => {
    this.props.toggleDisplayConflictCourses();
  };

  /**
   * 處理僅顯示已選課程的事件
   */
  handleToggleOnlySelected = () => {
    this.props.toggleOnlySelected();
  };

  render() {
    const {
      selectedCourses,
      basicFilter,
      advancedFilters,
      onAdvancedFilterChange,
      onClearAllSelectedCourses,
      displaySelectedOnly,
      displayConflictCourses,
      filterOptions,
    } = this.props;
    const { totalCredits, totalHours } =
      calculateTotalCreditsAndHours(selectedCourses);

    return (
      <>
        <Card.Body>
          <InputGroup className='mb-2'>
            {/* whats2000: 修改，使說明更清楚 */}
            <Form.Control
              id='all-course-filter'
              type='text'
              placeholder='用空格分隔，名稱、老師、學程、系所、課號'
              value={basicFilter ?? ''}
              onChange={this.handleFilterChange}
            />
            <InputGroup.Text>{totalCredits} 學分</InputGroup.Text>
            <InputGroup.Text>{totalHours} 小時</InputGroup.Text>
            <AdvancedFilter
              advancedFilters={advancedFilters}
              onAdvancedFilterChange={onAdvancedFilterChange}
              filterOptions={filterOptions}
            />
          </InputGroup>

          <ButtonsRow>
            <ToggleButtonGroup
              type='radio'
              name='options'
              defaultValue={'allCourses'}
              value={displaySelectedOnly ? 'onlySelected' : 'allCourses'}
              onChange={this.handleToggleOnlySelected}
            >
              <StyledButton
                variant='outline-success'
                id='tbg-radio-1'
                value={'allCourses'}
              >
                所有
              </StyledButton>
              <StyledButton
                variant='outline-success'
                id='tbg-radio-2'
                value={'onlySelected'}
              >
                僅已選
              </StyledButton>
            </ToggleButtonGroup>

            <div>
              <StyledButton
                id='toggle-show-conflict-courses'
                type='checkbox'
                variant='outline-success'
                onClick={this.handleShowSelectedCourses}
                value='show'
                checked={displayConflictCourses}
              >
                {displayConflictCourses ? '隱藏衝堂' : '顯示衝堂'}
              </StyledButton>
              <ClearSelectedCourses
                onClearAllSelectedCourses={onClearAllSelectedCourses}
              />
            </div>
          </ButtonsRow>
        </Card.Body>
      </>
    );
  }
}

export default ListInformation;
