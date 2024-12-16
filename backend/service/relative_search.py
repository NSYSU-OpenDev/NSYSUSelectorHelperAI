from typing import Dict

import pandas as pd
import torch
from sentence_transformers import CrossEncoder
from tqdm import tqdm

tqdm.pandas()


class CourseReranker:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.reranker_model = CrossEncoder('BAAI/bge-reranker-base', device=self.device)
        print(f"Using device: {self.device}")

    def score_courses(self, search_query: Dict[str, str], courses_df: pd.DataFrame, batch_size: int = 32) -> pd.DataFrame:
        """
        Score courses based on the search query.

        Args:
            search_query (Dict[str, str]): The search query.
            courses_df (pd.DataFrame): The courses dataframe.
            batch_size (int): The batch size for scoring.

        Returns:
            pd.DataFrame: The courses dataframe with relevance scores.
        """
        combined_query = " ".join(search_query.values())
        pairs = [
            (combined_query, f"{row['name']} {row['teacher']} {row['description']} {row['department']} {row['objectives']} {row['syllabus']}")
            for _, row in courses_df.iterrows()
        ]
        # Batch scoring
        relevance_scores = []
        for i in tqdm(range(0, len(pairs), batch_size)):
            batch = pairs[i:i+batch_size]
            scores = self.reranker_model.predict(batch)
            relevance_scores.extend(scores)

        courses_df['relevance_score'] = relevance_scores
        return courses_df.sort_values('relevance_score', ascending=False)



if __name__ == "__main__":
    test_query = {
        "teacher": "羅佩琪",
    }

    test_courses_df = pd.read_csv('../data/courses.csv')

    reranker = CourseReranker()

    scored_courses = reranker.score_courses(test_query, test_courses_df)

    print(scored_courses.head())
