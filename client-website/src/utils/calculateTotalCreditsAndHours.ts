import type { Course } from '@/types';
import { COURSE_DAY_NAMES } from '@/config.tsx';

/**
 * 計算總學分與總時數
 * @param selectedCourses {Set} 已選擇的課程集合
 * @returns {{totalCredits: number, totalHours: number}} 總學分與總時數
 */
export const calculateTotalCreditsAndHours = (
  selectedCourses: Set<Course>,
): { totalCredits: number; totalHours: number } => {
  let totalCredits = 0;
  let totalHours = 0;

  selectedCourses.forEach((course) => {
    totalCredits += parseFloat(course['Credit'] ?? '0.0');
    COURSE_DAY_NAMES.forEach((day) => {
      totalHours += course[day]?.length ?? 0;
    });
  });

  return { totalCredits, totalHours };
};
