import pandas as pd
import torch
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

tqdm.pandas()


class CourseFieldEmbeddingPreprocessor:
    def __init__(self, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(model_name, device=self.device)
        print(f"Using device: {self.device}")

    def preprocess_courses(self, courses_df: pd.DataFrame, output_file: str, batch_size: int = 256):
        """
        Precompute and save embeddings for individual fields.

        Args:
            courses_df (pd.DataFrame): The courses dataframe.
            output_file (str): Path to save precomputed embeddings.
            batch_size (int): Batch size for encoding.
        """
        fields_to_embed = ['name', 'description', 'department', 'objectives', 'syllabus', 'tags', 'teacher']
        embeddings_dict = {}

        print("Generating embeddings for each field...")
        for field in fields_to_embed:
            print(f"Encoding field: {field}")
            field_texts = courses_df[field].fillna('').tolist()
            embeddings = self.model.encode(field_texts, convert_to_tensor=True, batch_size=batch_size)
            embeddings_dict[field] = embeddings.cpu()

        # Save embeddings and course data
        torch.save({'field_embeddings': embeddings_dict, 'courses_df': courses_df}, output_file)
        print(f"Embeddings saved to {output_file}")


if __name__ == "__main__":
    # Load course data
    courses_df = pd.read_csv('../data/courses.csv')

    # Preprocess and save embeddings
    preprocessor = CourseFieldEmbeddingPreprocessor()
    preprocessor.preprocess_courses(courses_df, output_file='../data/precomputed_field_embeddings.pt')
