import asyncio

import pandas as pd
import requests
from typing import List, Dict, Any

from backend.src.api.clawer import extend_course_dataframe

BASE_URL = 'https://whats2000.github.io/NSYSUCourseAPI'


class NSYSUCourseAPI:
    """
    API client for retrieving NSYSU course data.
    """

    @staticmethod
    def get_available_semesters() -> Dict[str, Any]:
        """
        Retrieve all available semester lists.

        Returns:
            A dictionary representing available semesters.
        """
        response = requests.get(f"{BASE_URL}/version.json")
        if not response.ok:
            raise Exception("Failed to fetch available semesters")
        return response.json()

    @staticmethod
    def get_semester_updates(academic_year: str) -> Dict[str, Any]:
        """
        Retrieve semester update information for a specific academic year.

        Args:
            academic_year (str): The academic year.

        Returns:
            A dictionary representing semester updates.
        """
        response = requests.get(f"{BASE_URL}/{academic_year}/version.json")
        if not response.ok:
            raise Exception("Failed to fetch semester updates")
        return response.json()

    @staticmethod
    def get_courses(academic_year: str, update_time: str) -> List[Dict[str, Any]]:
        """
        Retrieve all courses for a specified academic year and update time.

        Args:
            academic_year (str): The academic year.
            update_time (str): The update time.

        Returns:
            A list of dictionaries representing courses.
        """
        response = requests.get(f"{BASE_URL}/{academic_year}/{update_time}/all.json")
        if not response.ok:
            raise Exception("Failed to fetch courses")

        courses = response.json()
        # Remove duplicates based on 'id' field
        unique_courses = []
        seen_ids = set()

        for course in courses:
            course_id = course.get("id")
            if course_id not in seen_ids:
                unique_courses.append(course)
                seen_ids.add(course_id)

        return unique_courses

    @staticmethod
    async def get_latest_courses() -> pd.DataFrame:
        """
        Retrieve all courses for the latest semester.

        Returns:
            A list of dictionaries representing courses for the latest semester.
        """
        semesters = NSYSUCourseAPI.get_available_semesters()
        latest_academic_year = semesters.get("latest")

        updates = NSYSUCourseAPI.get_semester_updates(latest_academic_year)
        latest_update_time = updates.get("latest")

        courses_df = pd.DataFrame(NSYSUCourseAPI.get_courses(latest_academic_year, latest_update_time))

        return await extend_course_dataframe(courses_df, 'url')


# Example Usage
if __name__ == "__main__":
    async def main():
        try:
            print("Fetching latest courses...")
            courses = await NSYSUCourseAPI.get_latest_courses()
            print(f"Number of courses fetched: {len(courses)}")
            print("Sample course:", courses.head() if not courses.empty else "No courses found")
            print("Index of the DataFrame:", courses.index)
            print("Columns of the DataFrame:", courses.columns)
        except Exception as e:
            print(e)

    asyncio.run(main())