import asyncio
import aiohttp
import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup

# Enable progress bar for DataFrame operations
tqdm.pandas()

async def extract_course_details(course_url: str) -> dict:
    """
    Extract course syllabus and objectives from the given URL asynchronously.

    Args:
        course_url (str): The URL of the webpage.

    Returns:
        dict: A dictionary containing the syllabus and objectives.
    """
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(course_url) as response:
                response.encoding = 'utf-8'  # Ensure correct encoding
                if response.status != 200:
                    return {"syllabus": "", "objectives": ""}
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

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
        except aiohttp.ClientError:
            return {"syllabus": "", "objectives": ""}


async def extend_course_dataframe(courses_df: pd.DataFrame, url_column: str) -> pd.DataFrame:
    """
    Extend the DataFrame by extracting syllabus and objectives for each URL asynchronously.

    Args:
        courses_df (pd.DataFrame): DataFrame containing a column of URLs.
        url_column (str): Name of the column containing URLs.

    Returns:
        pd.DataFrame: Updated DataFrame with syllabus and objectives columns.
    """
    tasks = [extract_course_details(url) for url in courses_df[url_column]]
    extracted_data = []
    with tqdm(total=len(tasks), desc="Fetching course details") as progress_bar:
        for future in asyncio.as_completed(tasks):
            result = await future
            extracted_data.append(result)
            progress_bar.update(1)

    extracted_df = pd.DataFrame(extracted_data)
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
    async def main():
      extended_courses_df = await extend_course_dataframe(test_df, 'url')
      print(extended_courses_df)

    asyncio.run(main())
