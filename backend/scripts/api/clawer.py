import asyncio
import aiohttp
import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup

# Enable progress bar for DataFrame operations
tqdm.pandas()

async def extract_course_details(course_url: str, progress_bar: tqdm) -> dict:
    """
    Extract course syllabus and objectives from the given URL asynchronously.

    Args:
        course_url (str): The URL of the webpage.
        progress_bar (tqdm): Shared progress bar instance.

    Returns:
        dict: A dictionary containing the syllabus and objectives.
    """
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(course_url) as response:
                response.encoding = 'utf-8'
                if response.status != 200:
                    return {"syllabus": "", "objectives": ""}
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                # Find Course Syllabus
                syllabus_tag = soup.find('p', string='課程大綱 Course syllabus')
                syllabus = syllabus_tag.find_next('td', colspan="12").get_text(strip=True) if syllabus_tag else ""

                # Find Course Objectives
                objectives_tag = soup.find('p', string='課程目標 Objectives')
                objectives = objectives_tag.find_next('td', colspan="12").get_text(strip=True) if objectives_tag else ""

                return {"syllabus": syllabus, "objectives": objectives}
        except aiohttp.ClientError:
            return {"syllabus": "", "objectives": ""}
        finally:
            # Update the progress bar
            progress_bar.update(1)

async def extend_course_dataframe(courses_df: pd.DataFrame, url_column: str) -> pd.DataFrame:
    """
    Extend the DataFrame by extracting syllabus and objectives for each URL asynchronously,
    with progress updates.

    Args:
        courses_df (pd.DataFrame): DataFrame containing a column of URLs.
        url_column (str): Name of the column containing URLs.

    Returns:
        pd.DataFrame: Updated DataFrame with syllabus and objectives columns.
    """
    total_tasks = len(courses_df[url_column])
    with tqdm(total=total_tasks, desc="Fetching course details") as progress_bar:
        tasks = [extract_course_details(url, progress_bar) for url in courses_df[url_column]]
        results = await asyncio.gather(*tasks)

    extracted_df = pd.DataFrame(results)
    extended_df = pd.concat([courses_df.reset_index(drop=True), extracted_df], axis=1)
    return extended_df


if __name__ == "__main__":
    # Example usage
    data = {'url': [
        'https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?SYEAR=113&SEM=1&CrsDat=GEAI1359&Crsname=人工智慧導論',
        'https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?SYEAR=113&SEM=1&CrsDat=GEAI1349&Crsname=無線網際網路',
        'https://selcrs.nsysu.edu.tw/menu5/showoutline.asp?SYEAR=113&SEM=1&CrsDat=GEAI1369&Crsname=基礎訊號處理'
    ]}

    test_df = pd.DataFrame(data)

    async def main():
        extended_courses_df = await extend_course_dataframe(test_df, 'url')
        print(extended_courses_df)

    asyncio.run(main())
