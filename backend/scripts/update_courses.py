import asyncio
import re

from tqdm import tqdm

from backend.scripts.api.courses_api import NSYSUCourseAPI

DATA_STORAGE_PATH = 'backend/src/data/courses.csv'

tqdm.pandas()


def remove_syllabus_header(text: str) -> str:
    """
    Remove the header that indicates the syllabus is in English.

    Args:
        text (str): The syllabus text.

    Returns:
        str: The syllabus text with the header removed.
    """
    # Remove the header that indicates the syllabus is in English
    text = text.replace('【Provide information of course syllabus in English.(This is for statistical use only. For those who do not provide information of course syllabus in English, do not check this field.)】', '')
    text = text.replace('本課程教學大綱已提供完整英文資訊（本選項僅供統計使用，未提供完整英文資訊者，得免勾記）', '')

    return text


def clean_syllabus(text: str) -> str:
    """
    Clean the syllabus text by removing unnecessary information.

    Args:
        text (str): The syllabus text.

    Returns:
        str: The cleaned syllabus text.
    """
    # Step 1: Remove file paths
    text = re.sub(r'\\\\\S+\.TXT', '', text)

    # Step 2: Remove leading numeric indices (e.g., "1,0," or "2,1,")
    text = re.sub(r'^\d+,\d+,?', '', text)

    # Step 3: Strip any surrounding whitespaces
    text = text.strip()

    return text

async def update_courses():
    """
    Update the course data from the NSYSU API and store it in a local file.
    """
    try:
        # Fetch course data from the NSYSU API
        course_data = await NSYSUCourseAPI.get_latest_courses()

        # Convert the syllabus to string and clean it
        course_data['syllabus'] = course_data['syllabus'].fillna('').progress_apply(str)

        # Remove the header that indicates the syllabus is in English
        course_data['syllabus'] = course_data['syllabus'].progress_apply(remove_syllabus_header)

        # Clean the syllabus text
        course_data['syllabus'] = course_data['syllabus'].progress_apply(clean_syllabus)

        # Store the course data in a local file
        course_data.to_csv(DATA_STORAGE_PATH, index=False)

    except Exception as e:
        print(f"Failed to update course data: {str(e)}")

if __name__ == '__main__':
    async def main():
        await update_courses()

    asyncio.run(main())
