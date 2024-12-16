import pandas as pd
import torch
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

tqdm.pandas()

class CourseEmbeddingPreprocessor:
    def __init__(self, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(model_name, device=self.device)
        print(f"Using device: {self.device}")

    def preprocess_courses(self, courses_df: pd.DataFrame, output_file: str, batch_size: int = 256):
        """
        Precompute and save embeddings for the course descriptions.

        Args:
            courses_df (pd.DataFrame): The courses dataframe.
            output_file (str): Path to save precomputed embeddings.
            batch_size (int): Batch size for encoding.
        """
        print("Combining course fields into text...")
        courses_df['combined_text'] = (
            courses_df['name'].fillna('') + " " +
            courses_df['teacher'].fillna('') + " " +
            courses_df['description'].fillna('') + " " +
            courses_df['department'].fillna('') + " " +
            courses_df['objectives'].fillna('') + " " +
            courses_df['syllabus'].fillna('')
        )

        # Generate embeddings
        print("Generating embeddings...")
        embeddings = self.model.encode(
            courses_df['combined_text'].tolist(),
            convert_to_tensor=True,
            batch_size=batch_size
        )

        # Save embeddings and course data
        torch.save({
            'course_embeddings': embeddings.cpu(),
            'courses_df': courses_df
        }, output_file)
        print(f"Embeddings saved to {output_file}")


if __name__ == "__main__":
    # Load course data
    courses_df = pd.read_csv('../data/courses.csv')

    # Preprocess and save embeddings
    preprocessor = CourseEmbeddingPreprocessor()
    preprocessor.preprocess_courses(courses_df, output_file='../data/precomputed_course_embeddings.pt')
