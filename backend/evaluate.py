from typing import List
import os
import sys
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from tqdm import tqdm
from contextlib import contextmanager

from app import main_pipeline
from src.types.chat_types import Message

# Load environment variables
load_dotenv()

@contextmanager
def suppress_stdout():
    with open(os.devnull, 'w') as devnull:
        old_stdout = sys.stdout
        sys.stdout = devnull
        try:
            yield
        finally:
            sys.stdout = old_stdout

def evaluate_pipeline_with_map(
    queries_ground_truth_df: pd.DataFrame,
    pipeline: callable,
    k_values: List[int] = None
):
    """
    Evaluate the retrieval pipeline using Hit@K and MAP.

    Args:
        queries_ground_truth_df (pd.DataFrame):
            DataFrame with at least two columns:
                - 'query': The query string
                - 'relative_courses_id': A list or set of relevant course IDs
        pipeline (callable):
            A function that takes arguments:
                messages: A list of Message objects
                _semesters: str
                _current_selected_course_ids: list
            and returns a tuple: (_, ranked_course_ids)
        k_values (List[int]):
            A list of cutoff values for computing Hit@K. Default: [5, 10, 20]

    Returns:
        metrics (dict): Aggregated metrics including Average Hit@K and MAP.
        query_results_df (pd.DataFrame): Query-level metrics.
    """

    if k_values is None:
        k_values = [5, 10, 20]

    hit_at_k = {k: [] for k in k_values}
    average_precisions = []
    query_results = []

    for _, row in tqdm(queries_ground_truth_df.iterrows(), total=len(queries_ground_truth_df), desc="Evaluating"):
        query = row["query"]
        ground_truth = set(row["relative_courses_id"])  # Relevant course IDs

        # Suppress pipeline output
        with suppress_stdout():
            _, ranked_course_ids = pipeline(
                messages=[Message(role="user", content=query)],
                _semesters="",
                _current_selected_course_ids=[]
            )

        # Determine the relevance of each retrieved course
        relevance = [1 if course_id in ground_truth else 0 for course_id in ranked_course_ids]

        # Compute Hit@K
        query_metrics = {"query": query, "ground_truth_size": len(ground_truth)}
        for k in k_values:
            top_k_relevance = relevance[:k]
            query_metrics[f"Hit@{k}"] = 1 if sum(top_k_relevance) > 0 else 0
            hit_at_k[k].append(query_metrics[f"Hit@{k}"])

        # Compute Average Precision for this query
        if len(ground_truth) > 0:
            precision_values = []
            num_relevant_retrieved = 0
            for rank, rel in enumerate(relevance, start=1):
                if rel == 1:
                    num_relevant_retrieved += 1
                    precision_values.append(num_relevant_retrieved / rank)
            average_precision = np.mean(precision_values) if precision_values else 0.0
        else:
            average_precision = 0.0

        query_metrics["AP"] = average_precision
        average_precisions.append(average_precision)
        query_results.append(query_metrics)

    # Aggregate results
    metrics = {
        f"Average Hit@{k}": np.mean(hit_at_k[k]) for k in k_values
    }
    # MAP is the mean of AP across all queries
    metrics["MAP"] = np.mean(average_precisions)

    return metrics, pd.DataFrame(query_results)


# Load ground truth data
queries_ground_truth = pd.read_csv("backend/src/data/query_target_label_with_tags.csv",
                                   converters={"relative_courses_id": eval})

# Evaluate pipeline
evaluate_metrics, query_metrics_df = evaluate_pipeline_with_map(
    queries_ground_truth_df=queries_ground_truth,
    pipeline=main_pipeline,
    k_values=[5, 10, 20]
)

# Print evaluation results
print("Evaluation Results:")
for metric, value in evaluate_metrics.items():
    print(f"{metric}: {value}")

# Save query-level metrics for analysis
query_metrics_df.to_csv("backend/src/data/query_level_metrics.csv", index=False)
print("Query-level metrics saved to 'query_level_metrics.csv'.")
