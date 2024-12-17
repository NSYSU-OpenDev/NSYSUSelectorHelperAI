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
                "你是一個專業的語言模型助手，專門根據提供的學程名稱生成可能由學生提出的自然詢問課程問題。"
                "你的回答應該模擬學生在搜尋學程相關課程時的問句，語氣應輕鬆自然且貼近日常使用。"
            )
        }

        # Few-shot examples to guide the model
        few_shot_examples = [
            {"role": "user", "content": "學程名稱：人工智慧學程\n請生成一個學生可能會詢問該學程相關課程的自然問題。"},
            {"role": "assistant",
             "content": "您好，我對科技類的學程很有興趣，請問有沒有推薦一些能學習機器人或AI相關知識的課程？"},

            {"role": "user", "content": "學程名稱：數據科學學程\n請生成一個學生可能會詢問該學程相關課程的自然問題。"},
            {"role": "assistant", "content": "最近聽說數據很重要，請問有沒有適合初學者的數據分析學程？"},

            {"role": "user", "content": "學程名稱：機器學習學程\n請生成一個學生可能會詢問該學程相關課程的自然問題。"},
            {"role": "assistant", "content": "我想學習如何讓電腦進行自動化學習，請問有哪些課程可以推薦？"},

            {"role": "user", "content": "學程名稱：大數據分析學程\n請生成一個學生可能會詢問該學程相關課程的自然問題。"},
            {"role": "assistant",
             "content": "您好，我對數據很感興趣，有沒有課程可以學習如何分析大量數據？像是商業應用或視覺化分析？"},

            {"role": "user", "content": "學程名稱：自然語言處理學程\n請生成一個學生可能會詢問該學程相關課程的自然問題。"},
            {"role": "assistant", "content": "有沒有專門學習語音識別或自動翻譯技術的課程？我想了解這類的技術如何運作。"},
        ]

        # Initialize list to store generated queries
        queries = []

        # Generate queries for each tag
        for tag in tags:
            # Add the current tag to the user message
            user_message = {
                "role": "user",
                "content": f"學程名稱：{tag}\n請生成一個學生可能會詢問該學程相關課程的自然問題。"
            }

            # Combine system message, few-shot examples, and the user message
            messages = [system_message] + few_shot_examples + [user_message]

            try:
                # Generate response using the pipeline
                response = self.pipeline(
                    messages,
                    max_new_tokens=50,
                    do_sample=True,
                    top_k=50,
                    temperature=0.7
                )

                # Extract and clean the response content
                query = response[0]['generated_text'][-1]['content'].strip()
                queries.append(query)

            except Exception as e:
                print(f"Error generating query for tag '{tag}': {e}")
                queries.append("Error: Failed to generate query")

        return queries

    def create_dataset(self, output_file: str, num_queries_per_tag: int = 3):
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
                    "relative_courses_id": list(course_ids)
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
