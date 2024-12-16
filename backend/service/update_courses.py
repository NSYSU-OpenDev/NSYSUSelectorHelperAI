import json

from backend.api.courses_api import NSYSUCourseAPI

DATA_STORAGE_PATH = '../data/courses.json'

def update_courses():
    """
    Update the course data from the NSYSU API and store it in a local file.
    """
    try:
        # Fetch course data from the NSYSU API
        course_data = NSYSUCourseAPI.get_latest_courses()

        # Store the course data in a local file
        with open(DATA_STORAGE_PATH, 'w') as file:
            json.dump(course_data, file, ensure_ascii=False, indent=4)
        print(f"Course data updated and stored at {DATA_STORAGE_PATH}")

    except Exception as e:
        print(f"Failed to update course data: {str(e)}")

if __name__ == '__main__':
    update_courses()
