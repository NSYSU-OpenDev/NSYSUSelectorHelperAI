import requests

import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup

# Enable progress bar for DataFrame operations
tqdm.pandas()

def extract_course_details(course_url: str) -> dict:
    """
    Extract course syllabus and objectives from the given URL.

    Args:
        course_url (str): The URL of the webpage.

    Returns:
        dict: A dictionary containing the syllabus and objectives.
    """
    # Fetch the webpage
    response = requests.get(course_url)
    response.encoding = 'utf-8'  # Ensure correct encoding

    if response.status_code != 200:
        return {"syllabus": "", "objectives": ""}

    soup = BeautifulSoup(response.text, 'html.parser')

    # Find Course Syllabus
    syllabus_tag = soup.find('p', string='課程大綱 Course syllabus')
    if syllabus_tag:
        syllabus = syllabus_tag.find_next('td', colspan="12").get_text(strip=True)
    else:
        syllabus = ""

    # Find Course Objectives
    objectives_tag = soup.find('p', string='課程目標 Objectives')
    if objectives_tag:
        objectives = objectives_tag.find_next('td', colspan="12").get_text(strip=True)
    else:
        objectives = ""

    return {"syllabus": syllabus, "objectives": objectives}


def extend_course_dataframe(courses_df: pd.DataFrame, url_column: str) -> pd.DataFrame:
    """
    Extend the DataFrame by extracting syllabus and objectives for each URL.

    Args:
        courses_df (pd.DataFrame): DataFrame containing a column of URLs.
        url_column (str): Name of the column containing URLs.

    Returns:
        pd.DataFrame: Updated DataFrame with syllabus and objectives columns.
    """
    # Apply the function with progress bar
    extracted_data = courses_df[url_column].progress_apply(lambda course_url: extract_course_details(course_url))

    # Convert the result into a DataFrame and concatenate
    extracted_df = pd.DataFrame(extracted_data.tolist())
    extended_df = pd.concat([courses_df, extracted_df], axis=1)

    return extended_df


if __name__ == "__main__":
    # Example usage
    data = {'url': [
        'https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?SYEAR=113&SEM=1&CrsDat=GEAI1359&Crsname=人工智慧導論',
        'https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?SYEAR=113&SEM=1&CrsDat=GEAI1349&Crsname=無線網際網路',
        'https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?SYEAR=113&SEM=1&CrsDat=GEAI1369&Crsname=基礎訊號處理'
    ]}

    # Create a DataFrame with URLs
    test_df = pd.DataFrame(data)

    # Extend the DataFrame with syllabus and objectives
    extended_courses_df = extend_course_dataframe(test_df, 'url')

    # Print the updated DataFrame
    print(extended_courses_df)
