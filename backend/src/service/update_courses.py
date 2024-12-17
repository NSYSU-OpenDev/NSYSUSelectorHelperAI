from backend.src.api.courses_api import NSYSUCourseAPI

DATA_STORAGE_PATH = 'backend/src/data/courses.csv'

def update_courses():
    """
    Update the course data from the NSYSU API and store it in a local file.
    """
    try:
        # Fetch course data from the NSYSU API
        course_data = NSYSUCourseAPI.get_latest_courses()

        # Store the course data in a local file
        course_data.to_csv(DATA_STORAGE_PATH, index=False)

    except Exception as e:
        print(f"Failed to update course data: {str(e)}")

if __name__ == '__main__':
    update_courses()
