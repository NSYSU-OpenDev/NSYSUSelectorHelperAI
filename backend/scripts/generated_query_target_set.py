from typing import List

import pandas as pd
import torch
from dotenv import load_dotenv
from tqdm import tqdm
from transformers import pipeline

load_dotenv()


class QueryTargetWithTagsGenerator:
    def __init__(self, model_name: str, courses_file: str):
        self.courses_df = pd.read_csv(courses_file)
        self._prepare_tags()

        # Load Hugging Face pipeline
        self.model_name = model_name
        self.pipeline = pipeline(
            "text-generation",
            model=model_name,
            model_kwargs={"torch_dtype": torch.bfloat16},
            device_map="auto",
        )
        print(f"Initialized with Hugging Face pipeline '{model_name}'.")

    def _prepare_tags(self):
        """Flatten and clean the tags."""
        self.courses_df['tags'] = self.courses_df['tags'].apply(lambda x: eval(x) if pd.notna(x) else [])
        self.tag_to_courses = {}
        for _, row in self.courses_df.iterrows():
            for tag in row['tags']:
                self.tag_to_courses.setdefault(tag, []).append(row['id'])

    def _get_related_courses(self, tag: str) -> List[str]:
        """
        Retrieve course names related to a specific tag.
        :param tag: The academic program tag.
        :return: List of related course names.
        """
        course_ids = self.tag_to_courses.get(tag, [])
        related_courses = self.courses_df[self.courses_df['id'].isin(course_ids)]['name'].tolist()
        return related_courses

    def batch_generate_queries(self, tags: List[str]) -> List[str]:
        """
        Generate batch queries using a Hugging Face transformer model with few-shot examples.
        :param tags: List of tags to generate queries for.
        :return: List of generated queries corresponding to the tags.
        """
        # Define the system message
        system_message = {
            "role": "system",
            "content": (
                "你是一個專業的語言模型助手，專門根據提供的學程名稱和相關課程名稱生成學生可能會提出的自然詢問問題。"
                "用戶會提供學程名稱與相關課程名稱，你需要生成自然語言的問題，語氣應輕鬆自然，模擬學生的查詢需求，且避免直接使用課程名稱。"
            ),
        }

        # Few-shot examples to guide the model
        few_shot_examples = [
            {"role": "user", "content": "學程名稱：人工智慧學程\n相關課程：人工智慧導論、機器學習\n請生成一個學生可能會詢問的自然問題。"},
            {"role": "assistant", "content": "我對AI很感興趣，有沒有推薦適合初學者的人工智慧或機器學習課程？"},

            {"role": "user", "content": "學程名稱：數據科學學程\n相關課程：數據分析基礎、大數據處理\n請生成一個學生可能會詢問的自然問題。"},
            {"role": "assistant", "content": "最近想學習數據分析，請問有哪些基礎的大數據課程推薦？"},

            {"role": "user", "content": "學程名稱：自然語言處理學程\n相關課程：語音識別技術、機器翻譯\n請生成一個學生可能會詢問的自然問題。"},
            {"role": "assistant", "content": "我想了解語音識別或自動翻譯技術，有推薦的課程嗎？"},
        ]

        # Initialize list to store generated queries
        queries = []

        # Generate queries for each tag
        for tag in tags:
            try:
                # Retrieve related course names for the current tag
                related_courses = self._get_related_courses(tag)
                course_list = "、".join(related_courses)

                # Add the current tag and related courses to the user message
                user_message = {
                    "role": "user",
                    "content": (
                        f"學程名稱：{tag}\n"
                        f"相關課程：{course_list}\n"
                        "請生成一個學生可能會詢問的自然問題。"
                    )
                }

                # Combine system message, few-shot examples, and the user message
                messages = [system_message] + few_shot_examples + [user_message]

                # Generate response using the pipeline
                response = self.pipeline(
                    messages,
                    max_new_tokens=512,
                    do_sample=True,
                    top_k=50,
                    temperature=0.7,
                    pad_token_id=self.pipeline.tokenizer.eos_token_id,
                )

                # Properly extract and clean the generated text
                query = response[0]['generated_text'][-1]['content'].strip()
                if query:
                    queries.append(query)
                else:
                    raise ValueError("Unexpected response format")

            except Exception as e:
                print(f"Error generating query for tag '{tag}': {e}")
                queries.append("Error: Failed to generate query")

        return queries

    def create_dataset(self, output_file: str, num_queries_per_tag: int = 8):
        """
        Generate an evaluation dataset where each query maps to a list of positive course IDs only.
        """
        dataset = []

        for tag, course_ids in tqdm(self.tag_to_courses.items(), total=len(self.tag_to_courses)):
            # Generate queries for the current tag in batch
            batch_tags = [tag] * num_queries_per_tag
            queries = self.batch_generate_queries(batch_tags)

            # Append query and positive courses
            for query in queries:
                dataset.append({
                    "query": query,
                    "relative_courses_id": list(course_ids),
                    "tags": tag,
                })

        # Convert to DataFrame and save
        df = pd.DataFrame(dataset)
        df.to_csv(output_file, index=False)
        print(f"Evaluation dataset saved to {output_file}")


if __name__ == "__main__":
    generator = QueryTargetWithTagsGenerator(
        model_name="meta-llama/Llama-3.1-8B-Instruct",  # Hugging Face model name
        courses_file="backend/src/data/courses.csv"
    )
    generator.create_dataset("backend/src/data/query_target_label_with_tags.csv")
