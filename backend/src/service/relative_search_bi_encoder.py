from typing import Dict
import pandas as pd
import torch
from sentence_transformers import SentenceTransformer, util
from tqdm import tqdm

tqdm.pandas()


class CourseRerankerWithFieldMapping:
    def __init__(self, embeddings_file: str, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(model_name, device=self.device)
        print(f"Using device: {self.device}")

        # Load precomputed embeddings and course data
        print("Loading precomputed embeddings...")
        checkpoint = torch.load(embeddings_file)
        self.field_embeddings = {k: v.to(self.device) for k, v in checkpoint['field_embeddings'].items()}
        print("Precomputed embeddings loaded successfully.")

        # Query-field mapping
        self.query_field_mapping = {
            "teacher": ["teacher"],
            "keywords": ["name", "description", "objectives", "syllabus", "tags"],
            "department": ["department"],
            "program": ["tags"],
        }

        # Field weights for keywords
        self.keywords_weights = {
            'name': 0.4,
            'description': 0.2,
            'objectives': 0.15,
            'syllabus': 0.1,
            'tags': 0.15
        }

    def score_courses(self, search_query: Dict[str, str], courses_df: pd.DataFrame) -> pd.DataFrame:
        """
        Score courses based on the search query using precomputed embeddings and filtering.

        Args:
            search_query (Dict[str, str]): The search query with fields as keys.
            courses_df (pd.DataFrame): The courses DataFrame to filter and score.

        Returns:
            pd.DataFrame: Filtered and sorted DataFrame with relevance scores.
        """
        df = courses_df.copy()
        relevance_scores = torch.zeros(len(df), device=self.device)

        for query_field, query_value in search_query.items():
            if not query_value:
                continue

            if query_field == "keywords":  # Weighted scoring for keywords
                query_embedding = self.model.encode(query_value, convert_to_tensor=True)
                for field, weight in self.keywords_weights.items():
                    if field in self.field_embeddings:
                        print(f"Scoring {field} for 'keywords' with weight {weight}")
                        field_scores = util.cos_sim(query_embedding, self.field_embeddings[field])
                        relevance_scores += weight * field_scores.squeeze()
            elif query_field == "grade":  # Filter directly for grade
                print(f"Filtering for grade: {query_value}")
                df = df[df['grade'] == query_value]
            else:  # Direct scoring for other fields
                mapped_fields = self.query_field_mapping.get(query_field, [])
                query_embedding = self.model.encode(query_value, convert_to_tensor=True)
                for field in mapped_fields:
                    if field in self.field_embeddings:
                        print(f"Scoring {field} for query field: {query_field}")
                        field_scores = util.cos_sim(query_embedding, self.field_embeddings[field])
                        relevance_scores += field_scores.squeeze()

        # Assign scores and sort results
        df = df.reset_index(drop=True)
        df['relevance_score'] = relevance_scores[:len(df)].cpu().numpy()
        return df.sort_values('relevance_score', ascending=False)

if __name__ == "__main__":
    # Sample query
    test_query = {
        "teacher": "羅珮綺",  # Example query
    }

    # Initialize and use the reranker with precomputed embeddings
    reranker = CourseRerankerWithFieldMapping(embeddings_file='../data/precomputed_field_embeddings.pt')
    scored_courses = reranker.score_courses(test_query, pd.read_csv('../data/courses.csv'))

    # Display top results
    print(scored_courses[['name', 'teacher', 'department', 'description', 'relevance_score']].head())
