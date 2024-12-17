
# System Architecture

## Overview

This document describes the system architecture of the backend course recommendation system, focusing on the Retrieval-Augmented Generation (RAG) pipeline. The system's primary goal is to understand user queries and provide relevant course recommendations.

## Components

The system is composed of the following key components:

1.  **Flask Application (`app.py`)**:
    *   Serves as the entry point of the backend.
    *   Handles API requests, specifically the `/chat` endpoint.
    *   Initializes and orchestrates the RAG pipeline.
    *   Manages data loading and response formatting.

2.  **Query Generator (`src/service/query_generator.py`)**:
    *   Converts the conversation history into a structured query suitable for course retrieval.
    *   Utilizes the Groq API with function calling to extract query parameters (teacher, keywords, department, program, grade).
    *   Reads a system prompt to guide the language model.

3.  **Course Reranker (`src/service/relative_search.py` or `src/service/relative_search_bi_encoder.py`)**:
    *   Scores courses based on the generated query.
    *   There are two options based on the `USE_CROSS_ENCODER` flag:
        *   **`CourseReranker`**: Uses a cross-encoder model (`BAAI/bge-reranker-base`) to compute relevance scores.
        *   **`CourseRerankerWithFieldMapping`**: Uses a bi-encoder model (`paraphrase-multilingual-MiniLM-L12-v2`) and precomputed embeddings to calculate the relevance score and supports field-specific filtering and weighting.

4.  **Final Response Generator (`src/service/final_response_generator.py`)**:
    *   Formats the retrieved courses and query into a detailed prompt.
    *   Connects to the Groq API and generates a natural language response based on the structured data and prompt.

## RAG Pipeline Workflow

1.  **User Input**: The user sends a query through the chat interface.
2.  **Query Generation**: The `query_generator.py` uses the Groq API to convert the conversation history into a structured query.
3.  **Course Retrieval**: The `relative_search.py` or `relative_search_bi_encoder.py` component scores and ranks courses based on the generated query, and the appropriate reranker is chosen based on `USE_CROSS_ENCODER` flag.
4.  **Final Response Generation**: The `final_response_generator.py` component formats a detailed prompt and uses the Groq API to create a final, human-readable response.
5.  **Output**: The final response is sent back to the user.

## Data Flow

-   The `app.py` loads course data from `src/data/courses.csv`.
-   The `relative_search_bi_encoder.py` loads precomputed embeddings from `src/data/precomputed_field_embeddings.pt`.
-   The `query_generator.py` reads a system prompt from `prompt.txt`.
-   The `final_response_generator.py` uses a system prompt in its internal logic.

## Key Technologies

-   **Flask**: Web framework for the backend.
-   **Groq API**: For language model based query generation and response generation.
-   **Sentence Transformers**: For sentence embedding and cross-encoder models.
-   **Pandas**: For data manipulation.

This system architecture provides a clear structure for understanding how the course recommendation system functions and how the RAG pipeline facilitates efficient and relevant responses to user queries.
