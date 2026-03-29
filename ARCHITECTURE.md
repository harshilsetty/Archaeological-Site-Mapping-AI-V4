# System Architecture

## 1) Full Pipeline

Input Image + Coordinates
-> Detection (YOLO)
-> Segmentation (DeepLabV3+)
-> Feature Engineering (vision ratios + geo APIs)
-> Erosion Prediction (XGBoost)
-> SHAP Explainability
-> LLM Narrative (optional)
-> UI Rendering + Reporting

## 2) Components and Responsibilities

### Computer Vision Layer

- Detection model identifies object instances: boulders, ruins, structures, vegetation, others.
- Segmentation model provides pixel-level terrain class masks.
- Outputs are fused into visual overlays and ratio-based features.

### Feature Engineering Layer

Visual features:

- vegetation ratio
- boulders ratio
- ruins ratio
- structures ratio

Geo-context features:

- slope (computed from elevation deltas)
- elevation (Open-Elevation)
- rainfall (Open-Meteo)
- soil type proxy (SoilGrids-derived class)

### ML Inference Layer

- XGBoost consumes engineered features to produce erosion risk probability.
- Decision threshold maps probability into risk labels (LOW/MODERATE/HIGH in app flows).

### Explainability Layer

- SHAP calculates per-feature contribution for each prediction.
- Top positive/negative contributors are extracted for transparency.

### LLM Insight Layer

- SHAP context plus metric payload is converted into concise natural-language interpretation.
- External provider wrappers support model routing and fallback behavior.

### UI / Delivery Layer

- Streamlit app for Python-first workflows.
- Next.js frontend with Python worker bridge for modern web UX.
- Produces detection/segmentation/combined overlays, metrics blocks, and report data.

## 3) Data Flow (Detailed)

1. User uploads an image and location (manual, EXIF, map selection).
2. Detection branch infers object boxes and per-class confidences.
3. Segmentation branch generates class mask and area statistics.
4. Geo APIs fetch elevation/rainfall/soil features with fallback defaults.
5. Feature vector is assembled according to expected model schema.
6. XGBoost predicts erosion probability and binary class.
7. SHAP computes local explanation for the same feature vector.
8. LLM optionally summarizes risk rationale from SHAP and feature values.
9. UI shows outputs and supports export/report operations.

## 4) Design Decisions

### Why YOLO

- Strong speed/accuracy trade-off for real-time detection.
- Mature ecosystem and standardized output artifacts.
- Supports scalable retraining and easy deployment.

### Why DeepLabV3+

- Robust semantic segmentation with encoder backbone flexibility.
- Suitable for terrain-like classes where shape context matters.
- Produces interpretable pixel-level masks and ratio features.

### Why XGBoost

- Excellent performance on tabular engineered features.
- Handles nonlinear interactions and mixed feature behavior well.
- Supports feature importance and works well with SHAP explainers.

### Why SHAP

- Local explanation of individual predictions.
- Quantifies contribution strength for each feature.
- Useful for decision support and stakeholder trust.

### Why LLM

- Converts technical explanation into actionable language.
- Improves communication for non-ML stakeholders.
- Adds human-readable context without changing core prediction logic.

## 5) Runtime Modes

### Streamlit Mode

- Entry point: `app.py`
- Best for rapid experimentation and direct Python environment control.

### Next.js + Python Worker Mode

- Frontend in `geo-ai-ui`
- API route coordinates request/response while Python worker runs model stack.
- Suitable for web-first demonstration and richer UX.

## 6) Production Artifact Layer

- Per-model metrics package generated under `artifacts/model_metrics_<date>/`.
- Includes machine-readable JSON summaries, markdown reports, and plots.
- Enables reproducibility, auditability, and benchmark comparison.
