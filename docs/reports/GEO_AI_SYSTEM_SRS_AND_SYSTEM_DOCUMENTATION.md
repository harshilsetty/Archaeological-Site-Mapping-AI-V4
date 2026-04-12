# Geo AI System
## Software Requirements Specification (SRS) and System Documentation

Document ID: GEOAI-SRS-001  
Version: 1.0.0  
Date: 2026-04-07  
Status: Production Specification Baseline

### Version History

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-04-07 | Initial production specification baseline |
| 1.1.0 | 2026-04-07 | Added architecture diagram, performance summary, walkthrough, design rationale, deployment considerations, and security/data handling enhancements |

---

## 1. Introduction

### 1.1 Purpose
Geo AI System is an AI-powered terrain intelligence platform for archaeological and environmental decision support. The system fuses computer vision, geospatial APIs, tabular machine learning, model explainability, and LLM-generated interpretation to convert remote imagery and location context into erosion risk assessments with transparent reasoning.

This document defines the software requirements and system design required for production-grade operation, maintainability, and extension.

### 1.2 Scope
The system scope includes:

- Image-based archaeological/terrain analysis using object detection and segmentation.
- Geospatial feature enrichment from external APIs (elevation, rainfall, soil).
- Erosion risk probability and risk class prediction via XGBoost.
- Local explainability using SHAP and deterministic fallback methods.
- Human-readable interpretation through LLM integration with fallback behavior.
- Dual interaction channels:
  - Streamlit UI (Python-first workflow).
  - Next.js UI + Python worker bridge (web-first workflow).
- Export-ready report generation and visual outputs.

Out of scope:

- Full geodetic terrain reconstruction from high-resolution DEM tiles.
- Regulatory-certified risk scoring for legal compliance without domain expert validation.
- Multi-tenant identity and access management as a complete enterprise SaaS feature set.

### 1.3 Definitions and Terminology

- AI: Artificial Intelligence.
- CV: Computer Vision.
- YOLO: You Only Look Once object detector.
- DeepLabV3+: Semantic segmentation architecture.
- XGBoost: Gradient-boosted decision tree algorithm for tabular prediction.
- SHAP: SHapley Additive exPlanations for feature attribution.
- Erosion Probability: Model output in [0, 1] representing estimated risk likelihood.
- Risk Label: Discrete mapping of probability into LOW, MODERATE, HIGH.
- Feature Vector: Structured numeric inputs consumed by erosion model.
- API Fallback: Deterministic or safe-default behavior when external service calls fail.
- Fast Mode: Reduced-cost inference profile (lower YOLO input size and optimized execution path).
- Insight Mode:
  - groq: LLM-generated external explanation.
  - local/default: internally generated deterministic explanation.

### 1.4 Target Users

- Archaeologists: prioritize excavation monitoring and site protection.
- Conservation researchers: study terrain degradation patterns.
- Urban/regional planners: pre-screen zones for mitigation planning.
- GIS and remote sensing analysts: evaluate visual evidence and geospatial indicators.
- Policy and field operations teams: consume interpretable risk summaries for action planning.

---

## 2. Problem Statement

### 2.1 Limitations of Manual Terrain Analysis

- Manual inspection of large geographic regions is slow and labor-intensive.
- Visual interpretation quality varies across analysts and institutions.
- Repeated surveys for seasonal monitoring are costly and hard to scale.
- Integrating terrain, climate, and visual evidence is difficult without automation.

### 2.2 Explainability Gap in Existing Systems

- Many AI systems provide only scores without transparent feature-level rationale.
- Decision stakeholders require traceable evidence before acting on risk signals.
- Lack of interpretable outputs weakens trust and slows operational adoption.

### 2.3 Need for Scalable Automated Analysis

- Cross-region monitoring demands repeatable, low-latency batch workflows.
- API and network variability requires resilient fallback mechanisms.
- Multi-user teams need consistent risk outputs and exportable audit artifacts.

---

## 3. System Overview

### 3.1 High-Level Architecture

Geo AI System consists of six major layers:

1. Input and Acquisition Layer
2. Computer Vision Layer
3. Feature Engineering Layer
4. ML Inference Layer
5. Explainability and Interpretation Layer
6. UI and Reporting Layer

### 3.2 End-to-End Pipeline

Input image + location
-> Detection (YOLO)
-> Segmentation (DeepLabV3+)
-> Feature extraction (visual ratios + geospatial APIs)
-> Erosion prediction (XGBoost)
-> Explainability (SHAP or local sensitivity fallback)
-> Narrative generation (LLM or deterministic fallback)
-> UI visualization + report export

### 3.3 Key Subsystems

#### 3.3.1 Image Processing Subsystem

- Performs object detection for classes including vegetation, ruins, structures, boulders, others.
- Performs semantic segmentation into terrain classes.
- Produces multiple visual channels:
  - detection overlay
  - segmentation overlay
  - combined overlay
  - risk heatmap view

#### 3.3.2 Feature Engineering Subsystem

- Computes class-ratio features from segmentation masks.
- Fetches geospatial context (elevation, rainfall, soil).
- Computes slope proxy from local elevation variation.
- Assembles model-compatible feature vectors based on runtime schema expectations.

#### 3.3.3 ML Prediction Subsystem

- Loads trained XGBoost model.
- Computes erosion probability.
- Maps probability to risk classes for user-facing presentation.

#### 3.3.4 Explainability Layer

- Generates SHAP contributions for local prediction interpretation.
- Provides ranked top feature impacts.
- Uses finite-difference sensitivity fallback if SHAP pipeline fails.

#### 3.3.5 UI Layer

- Streamlit interface for direct Python operations.
- Next.js interface for richer web interactions, persistence, and map workflows.
- Supports state-driven controls, visual toggles, and report operations.

---

## 4. Functional Requirements

### 4.1 Requirement Conventions

- Requirement IDs use FR-xxx format.
- Priority: P1 (critical), P2 (high), P3 (medium).
- Verification: Test, Inspection, Demonstration, Analysis.

### 4.2 Functional Requirement Catalog

FR-001 (P1) Image Upload  
The system shall allow users to upload image files in common raster formats (JPG, JPEG, PNG) for analysis.

FR-002 (P1) Coordinate Input  
The system shall support coordinate input by:
- manual latitude/longitude entry,
- map click selection,
- geocoded search selection,
- EXIF GPS extraction when metadata exists.

FR-003 (P1) Coordinate Source Resolution  
The system shall prioritize location sources by runtime policy:
- if valid EXIF GPS exists in uploaded image, use EXIF location,
- otherwise use user-selected/manual map coordinates.

FR-004 (P1) Object Detection  
The system shall run YOLO inference on the selected input image and return per-instance class labels, confidence values, and bounding boxes.

FR-005 (P1) Semantic Segmentation  
The system shall run DeepLabV3+ segmentation and produce a class mask aligned to image dimensions.

FR-006 (P1) Class Visibility Control  
The UI shall allow toggling per-class visualization for both detection and segmentation outputs.

FR-007 (P1) Visual Derivative Generation  
The system shall generate and expose at least the following visual outputs:
- original image,
- detection overlay,
- segmentation overlay,
- combined overlay,
- heatmap overlay.

FR-008 (P1) Feature Extraction  
The system shall compute class-ratio metrics (vegetation, boulders, ruins, structures) from segmentation mask area counts.

FR-009 (P1) Geospatial Enrichment  
The system shall fetch geospatial inputs from configured providers:
- elevation from Open-Elevation,
- rainfall from Open-Meteo,
- soil proxy from SoilGrids.

FR-010 (P1) Slope Computation  
The system shall compute slope proxy from local elevation differences using nearby sampled coordinates.

FR-011 (P1) Model-Schema Compatibility  
The system shall dynamically construct inference feature vectors according to the erosion model input schema (3, 4, 5, 6, or 8 features).

FR-012 (P1) Erosion Prediction  
The system shall output erosion probability in [0, 1] and risk label mapping (LOW/MODERATE/HIGH).

FR-013 (P1) Explainability Output  
When explainability is enabled, the system shall output ranked feature contributions using SHAP; if unavailable, use a deterministic local sensitivity fallback.

FR-014 (P2) AI Narrative Insight  
When AI insight is enabled, the system shall generate natural-language interpretation using configured LLM provider(s) and include status/mode metadata.

FR-015 (P1) Insight Fallback  
If external LLM generation fails or is disabled, the system shall return deterministic internal explanation text.

FR-016 (P2) Batch Point Analysis  
The Next.js API shall support multi-point analysis for capped point sets and return per-point risk outputs.

FR-017 (P2) Auto-Capture Map Snapshot  
When no file is uploaded, the system shall optionally capture static map imagery from provider fallbacks for analysis.

FR-018 (P1) Result Visualization  
The UI shall present risk score, risk class, terrain metrics, and interpretation in a state-consistent format.

FR-019 (P2) Report Export  
The system shall support report export (text/PDF-oriented pathways depending on UI mode) containing key metrics, risk, location, and explanation.

FR-020 (P1) Worker API Contract  
The backend worker interface shall support at least:
- predict action,
- insight action,
- structured success/error response envelopes.

FR-021 (P2) Cached Geospatial Features  
The feature extractor shall cache geospatial lookups by rounded coordinate keys to reduce repeated API overhead.

FR-022 (P2) Image Retrieval Caching  
The Next.js API shall cache generated non-original image outputs behind temporary image job IDs with TTL-based expiry.

FR-023 (P1) Input Validation  
The API shall validate coordinate and payload integrity and return informative errors for invalid requests.

FR-024 (P1) Failure Transparency  
The system shall propagate structured failure context (error message and bounded traceback details in backend paths) for debugging and observability.

FR-025 (P3) Session Persistence  
The Next.js UI shall persist selected control settings and notification states in browser local storage.

---

## 5. Non-Functional Requirements

### 5.1 Performance

NFR-001: Single-point prediction shall return within acceptable interactive latency under normal connectivity and baseline hardware profile.  
NFR-002: Fast mode shall reduce end-to-end compute cost by reducing detector image size and prioritizing responsive UX.  
NFR-003: Batch analysis shall process points sequentially or safely parallelized with bounded resource use and response stability.

### 5.2 Scalability

NFR-004: API shall cap batch point counts to prevent unbounded resource use.  
NFR-005: Model serving architecture shall support future migration to dedicated inference microservices and async queueing.

### 5.3 Reliability

NFR-006: External API failures shall not crash inference pipeline; deterministic fallback mechanisms must preserve response generation.  
NFR-007: Worker crash/exit shall reject pending jobs with explicit errors and permit worker re-initialization.  
NFR-008: Temporary resources (uploaded files, snapshots) shall be cleaned up in finally-path operations.

### 5.4 API Fallback Handling

NFR-009: Elevation, rainfall, and soil calls shall use timeout constraints.  
NFR-010: Static map image capture shall attempt multiple providers before declaring failure.  
NFR-011: Fallback paths shall preserve valid output schema even when degraded.

### 5.5 Usability (State-Based UI)

NFR-012: UI shall support explicit loading, success, error, and partial-content states.  
NFR-013: Visual controls shall be discoverable and persist where appropriate between sessions.  
NFR-014: Risk and explainability outputs shall remain readable for both technical and non-technical users.

### 5.6 Maintainability

NFR-015: Subsystems shall be logically separated (frontend, API route, worker, model utilities, terrain feature extraction).  
NFR-016: Code paths shall permit schema evolution without breaking legacy models (dynamic feature mode resolution).  
NFR-017: Documentation and generated metric artifacts shall support reproducibility and audit.

### 5.7 Security and Compliance (Baseline)

NFR-018: API keys shall be sanitized/normalized before use.  
NFR-019: Temporary files shall avoid persistent sensitive storage.  
NFR-020: Production hardening shall add authentication, request throttling, and audit logging for regulated deployments.

---

## 6. System Architecture (Detailed)

### 6.1 Component-Level Breakdown

#### 6.1.1 Frontend Layer (Next.js)

Responsibilities:

- User controls (upload, map, class visibility, confidence, mode toggles).
- Request orchestration for predict, batch, and insight endpoints.
- State management for loading phases and progressive content reveal.
- Local persistence of settings and notification state.
- Report preview/export UX.

Primary outputs:

- Processed metrics display.
- Visual overlays.
- SHAP feature bars/listings.
- AI narrative and fallback status.

#### 6.1.2 API Layer (Next.js Route)

Responsibilities:

- Validate multipart/form payloads.
- Handle prediction actions: single, batch, and insight-only.
- Spawn and communicate with persistent Python worker process.
- Manage image output caching and retrieval by job ID.
- Support auto-capture static snapshot flow when no upload exists.

#### 6.1.3 Python Worker Layer

Responsibilities:

- Load and cache ML/CV models at startup.
- Execute detection, segmentation, feature extraction, prediction, explainability.
- Generate AI explanation through provider integration and fallbacks.
- Return structured JSON response envelopes.

#### 6.1.4 Terrain Feature Service Layer

Responsibilities:

- Fetch elevation, rainfall, and soil from external APIs.
- Compute slope proxy from nearby elevations.
- Apply caching for repeated coordinate requests.
- Return normalized feature dictionary for model ingestion.

#### 6.1.5 Model Layer

- Detection model: YOLO family (primary trained checkpoint path in runs directory).
- Segmentation model: DeepLabV3+ (ResNet34 encoder, 6 classes).
- Erosion model: XGBoost classifier with schema-flexible feature assembly.

### 6.2 Interaction Architecture

#### 6.2.1 Web Runtime Interaction

1. Next.js client sends form payload to API route.
2. API route writes temporary image (upload or auto-capture).
3. API route sends job request via stdin JSON protocol to Python worker.
4. Worker executes inference stack and returns structured JSON via stdout.
5. API route caches heavy image outputs and returns initial payload.
6. Client pulls deferred images by job ID and renders full dashboard.

#### 6.2.2 Streamlit Runtime Interaction

1. User uploads image and selects location.
2. Streamlit process directly runs YOLO, segmentation, feature extraction.
3. Inference and SHAP are computed in-process.
4. UI renders visual outputs, metrics, and explanations.

### 6.3 Textual Data Flow Diagrams

#### 6.3.1 Core Prediction DFD

User Input
-> Image Loader
-> CV Pipeline (Detection + Segmentation)
-> Feature Aggregator (ratios + geo)
-> XGBoost Predictor
-> SHAP Analyzer
-> Insight Generator
-> UI Renderer
-> Report Export

#### 6.3.2 API + Worker DFD (Next.js Path)

Browser Client
-> POST /api/predict
-> Request Validator
-> Temp File Manager
-> Python Worker RPC
-> Prediction Payload
-> Image Cache (jobId)
-> JSON Response
-> Progressive Image Retrieval
-> Dashboard Presentation

### 6.4 Design Rationale

#### 6.4.1 Why CV + Tabular ML Instead of a Single End-to-End Deep Model

- The current production baseline separates perception (CV) from risk reasoning (tabular ML) to maximize traceability and maintainability.
- Segmentation and detection outputs become explicit intermediate variables that can be audited, validated, and versioned.
- This modularity permits targeted retraining (for example, updating segmentation without retraining the erosion model).
- In data-constrained archaeological settings, this architecture provides stronger operational control than monolithic end-to-end alternatives.

#### 6.4.2 Why XGBoost Instead of Fully Neural Tabular Alternatives

- XGBoost provides strong performance on compact engineered features and typically converges with less data.
- Inference latency and CPU efficiency align with interactive workflows and constrained deployment environments.
- The model captures non-linear feature interactions while preserving practical interpretability.
- Governance and maintenance are simplified because feature effects are easier to inspect than deep latent representations.

#### 6.4.3 Why SHAP for Explainability

- SHAP provides mathematically grounded local attributions with clear direction and magnitude.
- The output is suitable for both technical review and user-facing visualization.
- SHAP integrates consistently with tree-based models and supports continuity with deterministic fallback explainability.

#### 6.4.4 Why Dual UI Channels (Streamlit + Next.js)

- Streamlit supports rapid experimentation and researcher-focused diagnostic workflows.
- Next.js supports production-oriented web delivery with richer state management and interaction design.
- Dual channels balance research agility with product-grade delivery requirements.

---

## 7. System Architecture Diagram

### 7.1 End-to-End Pipeline Diagram (Textual)

```
+------------------+      +--------------------+      +----------------------+
|       User       | ---> | Frontend UI Layer  | ---> | Next.js API Route    |
| (Web/Streamlit)  |      | (Next.js/Streamlit)|      | (Validation + Orches)|
+------------------+      +--------------------+      +----------+-----------+
                                                                      |
                                                                      v
                                                      +-------------------------------+
                                                      | Python Worker Runtime         |
                                                      | (predict/insight dispatcher)  |
                                                      +---------------+---------------+
                                                                      |
                                 +------------------------------------+------------------------------------+
                                 |                                                                         |
                                 v                                                                         v
                  +----------------------------+                                         +----------------------------+
                  | CV Models                  |                                         | Feature Engineering        |
                  | YOLO + DeepLabV3+          |-------------- visual ratios ----------> | slope/elevation/rainfall/  |
                  | detection + segmentation   |                                         | soil + schema assembly     |
                  +-------------+--------------+                                         +-------------+--------------+
                                |                                                                      |
                                +------------------------------------+---------------------------------+
                                                                     v
                                                        +------------------------------+
                                                        | XGBoost Erosion Predictor    |
                                                        | probability + risk label     |
                                                        +---------------+--------------+
                                                                        |
                                 +--------------------------------------+------------------------------------+
                                 |                                                                           |
                                 v                                                                           v
                    +---------------------------+                                            +----------------------------+
                    | SHAP Explainability       |                                            | LLM Interpretation         |
                    | top feature contributions |                                            | narrative reasoning        |
                    +-------------+-------------+                                            +-------------+--------------+
                                  \                                                                 /
                                   \                                                               /
                                    v                                                             v
                                     +-----------------------------------------------------------+
                                     | UI Composition Layer (metrics, overlays, explainability) |
                                     +------------------------------+----------------------------+
                                                                    |
                                                                    v
                                                 +----------------------------------------+
                                                 | Report Export and Decision Artifacts    |
                                                 +----------------------------------------+
```

### 7.2 Pipeline Alignment Statement

The architecture diagram maps directly to the production pipeline: User -> Frontend -> API -> Python Worker -> CV Models -> Feature Engineering -> XGBoost -> SHAP -> LLM -> UI -> Report.

---

## 8. Data Flow (Very Detailed)

### 8.1 Input Stage

1. User provides image by upload or system auto-captures map snapshot.
2. User provides location through manual values or map selector; EXIF GPS may override in Streamlit flow.
3. Frontend validates basic coordinate and control states.

### 8.2 Computer Vision Stage

4. Detector executes with configured confidence threshold and mode parameters.
5. Detector emits object boxes, classes, confidences.
6. Segmenter runs on normalized tensor input and returns per-pixel class map.
7. Segmentation mask is resized to original image shape.
8. Overlay assets are synthesized for multiple visual channels.

### 8.3 Feature Engineering Stage

9. Pixel area ratios are computed for target classes.
10. Geospatial APIs are queried for elevation, rainfall, and soil.
11. Slope proxy is computed from nearby elevation deltas.
12. Feature vector is assembled according to model schema mode.

### 8.4 Prediction and Explainability Stage

13. XGBoost predicts probability p in [0, 1].
14. Risk label is derived by threshold partitioning.
15. SHAP computes local feature contribution values (if enabled).
16. If SHAP fails, finite-difference sensitivity estimates are produced.

### 8.5 Interpretation and Delivery Stage

17. LLM insight is requested if enabled and credentials/provider are available.
18. Deterministic explanation is generated as fallback when external generation fails or disabled.
19. Final payload combines risk, metrics, explanation, explainability artifacts, and images.
20. UI presents results and supports report export.

### 8.6 Batch Terrain Point Stage (Web)

21. Multiple geographic points are accepted and capped by API policy.
22. Shared image source is reused across points.
23. Worker predicts each point with same image and point-specific coordinates.
24. UI reveals point-level risk summaries and supporting context.

---

## 9. Feature Engineering (Critical)

### 9.1 Feature Set

Primary engineered features:

- vegetation ratio
- boulders ratio
- ruins ratio
- structures ratio
- slope
- elevation
- rainfall
- soil (encoded categorical)

### 9.2 Ratio Feature Definitions

For class c:

ratio_c = pixels(c) / total_pixels

Where total_pixels is the full segmentation mask area.

Interpretation rationale:

- Higher vegetation is generally associated with greater terrain stabilization.
- Higher exposed/structural disturbance patterns may increase erosion susceptibility, context-dependent.

### 9.3 Slope Calculation Logic

Given query location (lat, lon), sample elevations:

- e1 = elevation(lat, lon)
- e2 = elevation(lat + delta, lon)
- e3 = elevation(lat, lon + delta)

With delta approximately 0.001 degrees in the current production baseline.

Compute local directional differences:

- dx = |e2 - e1|
- dy = |e3 - e1|

Slope proxy:

slope = (dx + dy) / 2

Reasoning:

- Provides a low-cost terrain gradient proxy where full DEM tensors are unavailable.
- Robust enough for inference-time feature enrichment with constrained API inputs.

### 9.4 Rainfall Aggregation Logic

Rainfall feature uses daily precipitation summaries from Open-Meteo with a rolling past window in feature extractor pathways.

If daily precipitation array is r_1 ... r_n:

rainfall_avg = (sum_{i=1..n} r_i) / n

Reasoning:

- Smoother than single-day precipitation point.
- Better captures short-term hydrological loading related to erosion pressure.

### 9.5 Soil Encoding Logic

SoilGrids clay mean is mapped to discrete classes:

- clay > 40 -> soil = 3 (clay)
- 20 < clay <= 40 -> soil = 2 (loam)
- clay <= 20 -> soil = 1 (sandy)

Reasoning:

- Converts continuous raw soil signal into robust low-dimensional categorical proxy.
- Practical for tabular model stability under noisy external data.

### 9.6 Object-Based Features

Object-related context is represented through segmentation area ratios for boulders, ruins, and structures. These variables help encode terrain disturbance and anthropogenic/structural footprint characteristics relevant to erosion sensitivity.

### 9.7 Dynamic Schema Assembly

System supports multiple model schemas based on erosion model n_features_in_:

- 3-feature: slope, vegetation, elevation
- 4-feature: slope, vegetation, ruins, elevation
- 5-feature: slope, vegetation, elevation, rainfall, soil
- 6-feature: slope, vegetation, elevation, boulders, ruins, structures
- 8-feature: slope, vegetation, elevation, rainfall, soil, boulders, ruins, structures

If schema mismatch occurs, safe default vector path is used.

---

## 10. Model Design

### 10.1 YOLO (Detection)

Why YOLO:

- Real-time capable detector with strong speed/accuracy trade-off.
- Mature ecosystem and deployment tooling.
- Suitable for bounded object localization in archaeological/terrain scenes.

Design role:

- Capture discrete object evidence not directly available in coarse global descriptors.
- Provide interpretable bounding-box overlays for analyst trust.

### 10.2 DeepLabV3+ (Segmentation)

Why segmentation and why DeepLabV3+:

- Pixel-level labeling is required for ratio-based terrain composition features.
- DeepLabV3+ captures contextual semantics with encoder-decoder architecture.
- Produces stable mask outputs for downstream tabular feature engineering.

Design role:

- Convert raw imagery into spatial composition statistics used by erosion predictor.
- Support explainable visual evidence via class overlays.

### 10.3 XGBoost (Erosion Prediction)

Why XGBoost over alternatives:

- Strong performance on structured tabular features.
- Handles non-linear feature interactions and heterogeneous feature scales.
- Naturally compatible with SHAP explanation workflows.
- Efficient CPU inference suitable for responsive UI pipelines.

### 10.4 Training Strategy

CV models:

- Detector and segmenter are trained separately using task-specific scripts and checkpoints.
- Segmentation training combines cross-entropy and soft Dice components (weighted composition) for class and overlap quality.

Erosion model:

- Trained on engineered tabular dataset with explicit feature schema.
- Uses train/test split and standard classification metrics.
- Artifact outputs include model file, reports, confusion matrix, feature importance.

### 10.5 Feature Interactions

Conceptual interactions captured by boosted trees include:

- high slope + high rainfall increasing risk magnitude,
- protective effect of vegetation under moderate slope conditions,
- structural/ruins/boulders composition moderating base risk when geospatial factors are similar.

### 10.6 Decision Boundaries (Conceptual)

XGBoost creates piecewise decision regions in feature space via ensembles of tree splits. Instead of a single linear boundary, risk classification emerges from hierarchical thresholding over mixed feature subsets, enabling nuanced non-linear response surfaces.

---

## 11. Model Performance Summary

### 11.1 Metric Definitions

- Accuracy: overall proportion of correctly classified predictions.
- Precision: proportion of predicted positive outcomes that are truly positive.
- Recall: proportion of true positive outcomes successfully detected.
- F1 Score: harmonic mean of precision and recall for balanced performance analysis.
- RMSE: root-mean-square error for probabilistic outputs relative to labels.
- R2: explanatory variance captured by probability outputs.
- mAP@50 and mAP@50-95: detection quality across IoU criteria.
- IoU and Dice: overlap quality metrics for segmentation masks.

### 11.2 Erosion Model (XGBoost)

Holdout performance:

- Accuracy: 0.905
- Precision: approximately 0.90
- Recall: approximately 0.90
- F1 Score: approximately 0.90
- RMSE: approximately 0.27
- R2: approximately 0.70

Interpretation:

- Performance indicates robust and balanced classification suitable for operational risk triage.
- Probability-fit metrics support practical confidence ranking in the current production baseline.

### 11.3 Cross-Validation Summary

- Mean Accuracy: approximately 0.88
- Mean RMSE: approximately 0.34
- Mean R2: approximately 0.52

Interpretation:

- Cross-validation indicates stable behavior with expected split-dependent variance.
- These values support continued emphasis on data diversification and probability calibration governance.

### 11.4 Detection Model (YOLOv8s)

- Precision: approximately 0.89
- Recall: approximately 0.72
- mAP@50: approximately 0.83
- mAP@50-95: approximately 0.58

Interpretation:

- Detection precision is high, reducing false-positive visual alerts.
- Recall can be improved for harder or occluded instances in complex scenes.

### 11.5 Segmentation Model (DeepLabV3+)

- IoU: approximately 0.62 (macro IoU reference)
- Dice Score: approximately 0.77 (macro Dice reference)

Interpretation:

- Segmentation quality is appropriate for ratio-based feature engineering.
- Additional class balancing can improve fine boundary delineation.

---

## 12. Example Prediction Walkthrough

### 12.1 Input

- Image description: high-resolution satellite frame with sparse vegetation, exposed ruins, and mixed rocky terrain.
- Location: latitude 15.3350, longitude 76.4600.

### 12.2 Extracted Features

Illustrative feature bundle from the production baseline pipeline:

- slope: 18.40
- vegetation: 0.21
- rainfall: 12.60
- soil: loam (encoded as 2)
- elevation: 392.0
- boulders ratio: 0.09
- ruins ratio: 0.14
- structures ratio: 0.07

### 12.3 Model Output

- erosion probability: 0.76
- risk label: HIGH

### 12.4 SHAP Explanation

Top contributors (illustrative ordering):

- slope: positive impact (increases risk)
- ruins ratio: positive impact (increases risk)
- vegetation: negative impact (reduces risk)
- rainfall: positive impact (increases risk)

### 12.5 Final AI Explanation

"The location is assessed as high erosion risk because elevated slope and exposed ruin-dominant terrain increase runoff and surface instability. Vegetation is present but insufficient to offset the combined geophysical pressure signals. Prioritized inspection and mitigation planning are recommended."

### 12.6 Walkthrough Objective

This walkthrough demonstrates the complete evidence chain from geospatially anchored image input to explainable risk prediction and human-readable decision support.

---

## 13. Explainability Layer

### 13.1 SHAP Theory and Usage

For a prediction y_hat:

y_hat = phi_0 + sum(phi_i)

Where:

- phi_0 is the expected baseline output,
- phi_i is the contribution from feature i.

Interpretation:

- Positive phi_i pushes risk upward.
- Negative phi_i pushes risk downward.

### 13.2 Runtime Integration

- Build feature vector used for prediction.
- Compute SHAP values on same vector and model instance.
- Normalize dimensional variants in output tensor handling.
- Rank features by |phi_i| and return top contributors.

### 13.3 Deterministic Fallback Explainability

If SHAP computation fails for model/checkpoint compatibility or runtime reasons, local signed sensitivity is computed by finite differences around each feature dimension:

contribution_i approximately [p(x_i + h) - p(x_i - h)] / 2

This preserves directional interpretability when formal SHAP path is unavailable.

### 13.4 UI Integration

- Ranked features are rendered as textual contributors and/or chart bars.
- Color coding indicates risk-increasing versus risk-reducing influence.
- Explanation is linked to current prediction context (local, not global causality).

---

## 14. LLM Integration

### 14.1 Purpose

The LLM layer translates numeric and feature-level diagnostics into concise analyst-facing narratives that are easier to consume in planning and reporting contexts.

### 14.2 Provider Role

- External providers are invoked for richer explanation quality.
- Integration supports status/mode metadata and graceful fallback.
- Internal deterministic text generation remains available for resilience.

### 14.3 Prompt Engineering Approach

Prompt context conceptually combines:

- quantitative risk probability,
- selected engineered feature values,
- interpreted contribution signals.

The response is constrained toward operationally useful language: what is driving risk, why the risk level is assigned, and what action orientation is implied.

### 14.4 Guidance by SHAP + Features

- SHAP informs which factors to prioritize in narrative ordering.
- Feature values provide concrete numeric anchors.
- Risk label/probability calibrates severity language.

### 14.5 Operational Modes

- External AI mode: provider-generated narrative with status metadata.
- Local/default mode: deterministic explanation templates for no-key, disabled, or failure scenarios.

---

## 15. UI/UX Design Principles

### 15.1 State-Based UI

The interface is designed around explicit operational states:

- idle (no input),
- loading (prediction pending),
- partial (core metrics available, deferred visuals pending),
- success (full output),
- error (recoverable message and retry path).

### 15.2 Minimalist but Information-Dense Design

- Progressive disclosure via collapsible/sectioned views.
- Risk headline first, evidence and diagnostics second.
- Balanced visual hierarchy for decision velocity.

### 15.3 AI-First Interaction Model

- Primary interaction focuses on analysis task completion, not low-level configuration burden.
- Controls for explainability and insight are optional, contextual, and persistent.

### 15.4 User Flow Optimization

Canonical flow:

1. Select/upload image.
2. Choose location.
3. Run prediction.
4. Review risk card and interpretation.
5. Inspect visual evidence and metrics.
6. Inspect explainability.
7. Export report.

### 15.5 Additional UX Considerations

- Class visibility toggles improve targeted visual interpretation.
- Keyboard/interaction shortcuts and persisted settings improve repeated workflows.
- Terrain map tab supports exploratory point sampling and area-centric analysis patterns.

---

## 16. Error Handling and Fallbacks

### 16.1 API Failures

Geospatial API failures are isolated with try/except safeguards and deterministic fallback mechanisms to avoid pipeline failure.

Current deterministic fallback mechanisms include bounded policy defaults in the terrain extractor and UI-facing service paths.

### 16.2 Missing Metadata

- If image lacks EXIF GPS metadata, manual/map coordinates are used.
- If optional response fields are missing, output schema remains stable with defaults.

### 16.3 Deterministic Default Handling

Representative deterministic fallback mechanisms include:

- elevation fallback,
- rainfall fallback,
- soil fallback,
- slope fallback,
- explanation fallback.

These keep the system operational under partial data unavailability.

### 16.4 Worker and Process Failures

- Worker process lifecycle events clear pending jobs with explicit rejection.
- API route returns structured error envelopes with error and bounded traceback details.
- Temporary files are cleaned up in finally blocks.

### 16.5 Static Snapshot Provider Fallback

When auto-capturing imagery, the system attempts multiple static-map providers and validates content type/size before acceptance.

---

## 17. Deployment and Production Considerations

### 17.1 Model Serving Strategies

- Baseline serving architecture uses a persistent Python worker with preloaded model assets to reduce startup latency.
- Production evolution should move toward containerized inference services with explicit model registry integration and version pinning.
- Recommended topology: API gateway -> inference service pool -> artifact store -> observability stack.

### 17.2 Scaling Approach

- Use stateless API instances with independently autoscaled worker pools.
- Separate interactive single-point inference from batch workloads to protect latency SLOs.
- Introduce asynchronous queue-backed execution for large batch scenarios with bounded concurrency.

### 17.3 Caching Strategy

- Coordinate-level caching for geospatial feature retrieval.
- TTL-based visual artifact caching for deferred image retrieval.
- Optional memoization for repeated coordinate-image inference requests under deterministic settings.

### 17.4 API Rate Handling

- Apply timeout constraints, bounded retries, and exponential backoff for external providers.
- Implement circuit-breaker behavior during provider degradation periods.
- Enforce request throttling and point-count caps to preserve service quality under load.

### 17.5 Monitoring and Logging

- Track latency percentiles, error rates, fallback invocation rates, worker restarts, and queue depth.
- Monitor model outputs for drift in probability distributions and class balance.
- Record model version, feature schema mode, and execution path metadata for auditability.

---

## 18. Security and Data Handling

### 18.1 API Key Handling

- API keys are normalized and sanitized before worker dispatch.
- Production deployments should source credentials from secure secret management systems.
- Sensitive keys must never be persisted in client payloads, logs, or generated reports.

### 18.2 Input Validation

- Validate coordinate ranges, action types, and payload schema at API boundaries.
- Enforce file type and file size constraints before temporary storage.
- Reject malformed payloads with deterministic, structured error contracts.

### 18.3 Safe File Handling

- Temporary files are written to isolated system temp paths and deleted in finally blocks.
- User-controlled path construction is disallowed.
- External snapshot content is verified via content-type and minimum-size validation checks.

### 18.4 Future Authentication and Authorization

- Introduce authenticated API access with short-lived tokens.
- Add role-based authorization for analysis, batch execution, and report export operations.
- Add tenant-aware quotas and policy enforcement for SaaS-grade multi-organization usage.

### 18.5 Data Governance Roadmap

- Define retention policies for uploads, cached outputs, and exported reports.
- Enforce encryption in transit and at rest for persisted assets.
- Maintain dataset provenance and model lineage for audit and research reproducibility.

---

## 19. Limitations

### 19.1 Dataset Constraints

- Training data quantity and geographic diversity limit generalization guarantees.
- Certain terrain or archaeological classes may remain underrepresented.

### 19.2 Model Generalization Risks

- Domain shift (season, sensor, region, altitude) can degrade CV and tabular model reliability.
- Risk outputs should be treated as decision-support indicators, not deterministic ground truth.

### 19.3 API Dependency

- External geospatial APIs affect latency and feature fidelity.
- Deterministic fallback mechanisms preserve availability but may reduce predictive precision.

### 19.4 Slope Approximation

- Current slope method is a local proxy, not full DEM gradient analysis.
- High-resolution terrain physics are not explicitly modeled in this version.

### 19.5 Explainability Caveats

- SHAP is local to each prediction and does not establish causal inference.
- Fallback sensitivity mode is approximate and less theoretically complete than SHAP.

---

## 20. Future Scope

### 20.1 DEM Integration

- Integrate raster DEM sources for more physically grounded slope/curvature/hydrology features.
- Enable multi-scale terrain derivatives beyond local finite differences.

### 20.2 Multi-Point and Spatial Mapping Expansion

- Expand from capped point analysis to robust geospatial tiling and map-grid scanning.
- Add contour-level risk visualization and geospatial export formats.

### 20.3 SaaS Deployment Readiness

- Add authentication, role-based access control, audit logs, and tenant isolation.
- Deploy worker inference as autoscaling service with queue and observability stack.

### 20.4 Scalability Enhancements

- Introduce asynchronous batch scheduling and concurrency-safe job orchestration.
- Add response caching and feature prefetch pipelines for hotspot regions.

### 20.5 Model and Explainability Improvements

- Improve dataset diversity and active learning loops with expert feedback.
- Add calibration monitoring and drift detection.
- Extend explanation layer with global summaries and confidence diagnostics.

---

## Appendix A: Risk Thresholds

Current operational mapping:

- LOW: probability < 0.30
- MODERATE: 0.30 <= probability < 0.70
- HIGH: probability >= 0.70

Note: Some legacy pathways include binary labels using 0.5 threshold for HIGH/LOW. Production policy should standardize threshold semantics across all surfaces.

## Appendix B: Core Interfaces (Conceptual)

### B.1 Predict Request Inputs

- image (file or auto-capture mode)
- lat, lon
- confidence
- classVisibility toggles
- useAiInsight
- includeShap
- fastMode

### B.2 Predict Response Outputs

- probability
- riskLabel
- explanation
- insightMode / insightStatus
- metrics object
- shap list
- image bundle (direct or deferred via jobId)

### B.3 Insight-Only Inputs

- metrics object
- probability
- apiKey
- includeAiInsight
- includeShap

### B.4 Insight-Only Outputs

- explanation
- insightMode / insightStatus
- shap list (when enabled)

## Appendix C: Production Hardening Checklist

- Replace non-deterministic fallback sampling with policy-based deterministic defaults.
- Add centralized logging and metrics (latency, fallback rates, model confidence distribution).
- Add API retry/backoff and circuit-breaker patterns.
- Add schema validation for external API responses.
- Add secure secret management and key rotation.
- Add integration tests for API route/worker protocol.
- Add contract tests for predict payload invariants.

---

End of document.
