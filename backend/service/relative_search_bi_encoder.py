from typing import Dict
import pandas as pd
import torch
from sentence_transformers import SentenceTransformer, util
from tqdm import tqdm

tqdm.pandas()


class CourseRerankerBiEncoder:
    def __init__(self, embeddings_file: str, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(model_name, device=self.device)
        print(f"Using device: {self.device}")

        # Load precomputed embeddings and course data
        print("Loading precomputed embeddings...")
        checkpoint = torch.load(embeddings_file)
        self.course_embeddings = checkpoint['course_embeddings'].to(self.device)
        print("Precomputed embeddings loaded successfully.")

    def score_courses(self, search_query: Dict[str, str], courses_df: pd.DataFrame) -> pd.DataFrame:
        """
        Score courses based on the search query using precomputed embeddings.

        Args:
            search_query (Dict[str, str]): The search query.
            courses_df (pd.DataFrame): The courses dataframe

        Returns:
            pd.DataFrame: The courses dataframe with relevance scores.
        """
        combined_query = " ".join(search_query.values())

        # Encode the query
        print("Encoding the search query...")
        query_embedding = self.model.encode(combined_query, convert_to_tensor=True)

        # Compute cosine similarity
        print("Calculating relevance scores...")
        relevance_scores = util.cos_sim(query_embedding, self.course_embeddings)

        # Assign scores to DataFrame
        courses_df['relevance_score'] = relevance_scores.cpu().numpy().flatten()
        return courses_df.sort_values('relevance_score', ascending=False)


if __name__ == "__main__":
    # Sample query
    test_query = {
        "teacher": "羅佩琪",  # Example query
    }

    # Initialize and use the reranker with precomputed embeddings
    reranker = CourseRerankerBiEncoder(embeddings_file='../data/precomputed_course_embeddings.pt')
    scored_courses = reranker.score_courses(test_query, pd.read_csv('../data/courses.csv'))

    # Display top results
    print(scored_courses.head())
