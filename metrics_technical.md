# Geo AI System: Technical Documentation and Metrics Analysis

Document Type: Engineering Technical Reference and Metrics Whitepaper  
Project: Geo AI System  
Version: 1.0.0  
Date: 2026-04-07

---

## 1. Overview

Geo AI System is a production-oriented terrain analysis and erosion-risk assessment platform that integrates computer vision, geospatial feature enrichment, tabular machine learning, local explainability, and optional LLM-based interpretation. The system is architected for both research extensibility and operational decision support.

Purpose of this document:

- Provide a deep technical reference for engineers, reviewers, and interviewers.
- Explain metric behavior and model performance in operational context.
- Document algorithms, feature logic, and system-level design trade-offs.

Primary focus areas:

- Model metrics and performance diagnostics.
- Algorithmic reasoning and interaction among model components.
- Feature engineering mathematics and inference pipeline behavior.
- Architectural decisions, failure modes, and production implications.

---

## 2. Technology Stack (Detailed)

### 2.1 Frontend

#### Next.js

Role:

- Serves as the primary web application runtime and API host for browser-driven workflows.
- Provides server-side routing and API abstraction for Python worker orchestration.

Why it is used:

- Strong production deployment story and routing architecture.
- Enables API route colocation with frontend for cohesive release management.
- Supports dynamic rendering and progressive UI patterns required by long-running inference tasks.

#### Tailwind CSS

Role:

- Utility-first design system for high-density, consistent UI composition.

Why it is used:

- Accelerates maintainable component styling with predictable tokens.
- Reduces stylesheet sprawl and supports consistent visual hierarchy.
- Simplifies responsive behavior for desktop/mobile inference workflows.

#### Framer Motion

Role:

- Handles transitions, progressive reveals, and state-aware motion cues.

Why it is used:

- Enhances perceived responsiveness during asynchronous inference and image streaming.
- Supports controlled motion modes (including reduced motion) for accessibility and usability.
- Improves information sequencing in complex result dashboards.

### 2.2 Backend

#### Python Worker Architecture

Role:

- Executes model-heavy CV and ML inference in a persistent Python process.
- Handles predict and insight actions over a structured message protocol.

Why worker execution is used:

- Avoids repeated interpreter and model initialization costs per request.
- Isolates ML runtime dependencies from frontend server runtime concerns.
- Improves throughput and latency stability via warm model state.

Benefits over direct in-request execution:

- Lower tail latency by reusing loaded model artifacts.
- Cleaner fault isolation and explicit error envelope handling.
- More predictable resource management for CPU/GPU-bound tasks.

#### API Bridge (Next.js -> Python)

Role:

- Validates inputs, manages temporary files/snapshots, dispatches worker jobs, and normalizes responses.

Key backend advantages:

- Enforces payload constraints and action contracts.
- Supports single-point, batch, and insight-only execution paths.
- Provides deferred image retrieval via TTL-based image job caching.

### 2.3 Machine Learning and Computer Vision

#### YOLOv8s (Object Detection)

Purpose:

- Detects terrain and archaeological object classes with bounding boxes and confidence scores.

System interaction:

- Produces localized object evidence used for visual analysis and context interpretation.
- Detection overlays are fused with segmentation views for analyst-facing outputs.

#### DeepLabV3+ (Semantic Segmentation)

Purpose:

- Performs pixel-level semantic labeling for terrain composition.

System interaction:

- Provides class masks used to compute ratio-based engineered features.
- Enables deterministic area statistics for vegetation and object-related coverage.

#### XGBoost (Erosion Prediction)

Purpose:

- Predicts erosion probability from engineered visual and geospatial features.

System interaction:

- Consumes schema-flexible feature vectors assembled at inference time.
- Outputs calibrated probability and risk class used for downstream explainability and reporting.

### 2.4 APIs

#### Open-Meteo (Rainfall)

Data used:

- Daily precipitation summaries, including recent history window aggregation.

Limitations:

- Response latency variability and occasional service interruption.
- Granularity and local microclimate mismatch risk.

Deterministic fallback mechanism:

- Bounded fallback rainfall values preserve schema completeness during service degradation.

#### Open-Elevation (Elevation)

Data used:

- Elevation at queried coordinates and nearby offsets for slope proxy computation.

Limitations:

- External availability and precision constraints by source coverage.

Deterministic fallback mechanism:

- Default elevation and slope fallback policy prevents pipeline interruption.

#### SoilGrids (Soil)

Data used:

- Clay content proxy mapped to soil class encoding.

Limitations:

- Soil generalization and depth-specific representation limits.

Deterministic fallback mechanism:

- Neutral class defaults maintain feature vector integrity.

---

## 3. Model Metrics (Very Detailed)

### 3.1 Erosion Model (XGBoost)

Reference metrics:

- Accuracy: 0.905
- Precision: approximately 0.90 to 0.91
- Recall: approximately 0.90 to 0.91
- F1-score: approximately 0.90
- RMSE: approximately 0.27
- R2: approximately 0.70
- Confusion Matrix: [[91, 9], [10, 90]]

Metric-by-metric explanation:

#### Accuracy (0.905)

What it measures:

- Fraction of total predictions that are correct.

Why it matters:

- Provides baseline global correctness.

Interpretation:

- 90.5% indicates high aggregate classification performance under holdout conditions.

#### Precision (approximately 0.90 to 0.91)

What it measures:

- $\mathrm{Precision}=\frac{TP}{TP+FP}$

Why it matters:

- Controls false-alert burden for high-risk predictions.

Interpretation:

- High precision suggests predicted risk zones are usually valid, reducing unnecessary interventions.

#### Recall (approximately 0.90 to 0.91)

What it measures:

- $\mathrm{Recall}=\frac{TP}{TP+FN}$

Why it matters:

- Controls missed-risk events.

Interpretation:

- High recall indicates strong capture of true erosion-risk instances.

#### F1-score (approximately 0.90)

What it measures:

- Harmonic mean of precision and recall: $F1=\frac{2PR}{P+R}$

Why it matters:

- Useful when both false positives and false negatives are relevant.

Interpretation:

- Balanced F1 indicates no major skew toward either precision-only or recall-only behavior.

#### RMSE (approximately 0.27)

What it measures:

- Root-mean-square distance between probability output and label target.

Why it matters:

- Reflects probabilistic calibration quality, not only thresholded class outcome.

Interpretation:

- Moderate RMSE indicates practical probability fit suitable for risk ranking workflows.

#### R2 (approximately 0.70)

What it measures:

- Relative variance explained by model probability outputs.

Why it matters:

- Additional calibration-aligned perspective for probability behavior.

Interpretation:

- Approximately 0.70 suggests strong explanatory alignment for this binary probability formulation.

#### Confusion Matrix ([[91, 9], [10, 90]])

What it measures:

- Distribution of true/false positives and negatives.

Interpretation:

- True negatives: 91, true positives: 90.
- False positives: 9, false negatives: 10.
- Error profile is balanced, indicating stable decision thresholds without severe class asymmetry.

### 3.2 Cross Validation

Representative 5-fold scores:

- Accuracy scores: [0.920, 0.885, 0.855, 0.875, 0.875]
- RMSE scores: [0.2828, 0.3391, 0.3808, 0.3536, 0.3536]
- R2 scores: [0.68, 0.54, 0.42, 0.50, 0.50]

Mean values:

- Mean Accuracy: approximately 0.88
- Mean RMSE: approximately 0.34
- Mean R2: approximately 0.52

Interpretation (stability and generalization):

- Mean accuracy close to holdout performance indicates acceptable stability.
- RMSE and R2 variation across folds suggests moderate sensitivity to split composition, expected in geospatially heterogeneous datasets.
- The model generalizes reasonably but benefits from additional regional diversity and calibration monitoring.

### 3.3 Detection Model (YOLOv8s)

Metrics:

- Precision: approximately 0.89
- Recall: approximately 0.72
- mAP@50: approximately 0.83
- mAP@50-95: approximately 0.58

Explanation:

- Precision indicates predicted boxes are largely correct.
- Recall indicates some true objects remain undetected, especially hard/occluded cases.
- mAP@50 captures lenient IoU performance; mAP@50-95 reflects stricter localization quality.

Trade-off interpretation:

- The model favors reliable positive detections (high precision) with moderate recall, an acceptable profile for analyst-assisted workflows where false visual alerts are costly.

### 3.4 Segmentation Model

Metrics:

- IoU: approximately 0.62 (macro)
- Dice Score: approximately 0.77 (macro)

Explanation:

- IoU quantifies overlap strictness between predicted and true masks.
- Dice emphasizes overlap similarly but is more forgiving for small-region mismatches.

Importance for feature extraction:

- Segmentation quality directly controls engineered ratio features (vegetation, ruins, structures, boulders).
- Reliable mask overlap is therefore a first-order driver of downstream tabular prediction quality.

---

## 4. Algorithms Used (Deep Explanation)

### 4.1 XGBoost

Core concept:

- Gradient boosting builds an additive ensemble of decision trees where each new tree minimizes residual loss from prior trees.

Tree ensemble logic:

- At step $t$, model update is $\hat{y}^{(t)}=\hat{y}^{(t-1)}+\eta f_t(x)$, where $f_t$ is a new tree and $\eta$ is learning rate.
- Splits are selected to optimize gain under regularized objective.

Feature interaction handling:

- Non-linear interactions are captured via hierarchical split structure.
- Mixed continuous/categorical encodings are handled without heavy preprocessing.

Why suitable here:

- Compact feature vector, mixed signal domains, and need for explainability-aligned behavior.

### 4.2 YOLO

One-stage detection:

- Predicts boxes and class probabilities in a single forward pass.

Bounding box prediction:

- Learns localization offsets and confidence jointly with classification.

Speed vs accuracy trade-off:

- One-stage architecture provides lower latency than many two-stage detectors.
- YOLOv8s selected for stronger quality than nano baselines while preserving interactive feasibility.

### 4.3 DeepLabV3+

Encoder-decoder structure:

- Encoder extracts rich semantic features.
- Decoder recovers spatial detail for dense per-pixel labeling.

Semantic segmentation logic:

- Produces class logits per pixel; argmax yields final mask.
- Mask used both for visualization and deterministic ratio computation.

### 4.4 SHAP

Shapley value concept:

- Each feature contribution reflects average marginal contribution across feature coalitions.

Contribution calculation:

- Prediction decomposed into baseline plus per-feature contributions.
- Positive SHAP values push predicted risk upward; negative values reduce it.

Local interpretability:

- Explanations are prediction-specific and suitable for per-case audit.

---

## 5. Feature Engineering (Deep Technical)

### 5.1 Vegetation Ratio

Definition:

- $\mathrm{vegetation\_ratio}=\frac{N_{veg}}{N_{total}}$

Why it matters:

- Vegetation cover correlates with surface stabilization and reduced runoff-induced soil displacement.

### 5.2 Slope Calculation

Proxy method:

- Query elevations at $(lat,lon)$, $(lat+\delta,lon)$, $(lat,lon+\delta)$.
- Compute $dx=|e_2-e_1|$, $dy=|e_3-e_1|$.
- Slope proxy: $\mathrm{slope}=\frac{dx+dy}{2}$.

Why it matters:

- Slope is a principal erosion driver through runoff acceleration and gravitational transport.

### 5.3 Rainfall Averaging

Aggregation:

- $\mathrm{rainfall\_avg}=\frac{1}{n}\sum_{i=1}^{n} r_i$ over daily precipitation series.

Why it matters:

- Captures short-term hydrological stress better than instantaneous precipitation points.

### 5.4 Soil Encoding

Soil class mapping from clay proxy:

- clay > 40 -> 3 (clay)
- 20 < clay <= 40 -> 2 (loam)
- clay <= 20 -> 1 (sandy)

Why it matters:

- Soil texture influences infiltration, cohesion, and runoff behavior, which affect erosion susceptibility.

---

## 6. Data Pipeline

Pipeline:

Input -> preprocessing -> feature vector assembly -> erosion model -> explainability -> narrative -> output

### 6.1 Input and Preprocessing

- Input image acquired from upload or auto-captured map snapshot.
- Coordinates acquired from manual/map/metadata pathways.
- Detection confidence and class-visibility controls configured.

### 6.2 Transformations

- Segmentation preprocessing scales image tensor by dividing pixel values by 255.0.
- Mask resized to original resolution before ratio extraction.
- Geospatial values merged with visual ratios.

### 6.3 Normalization and Scaling

- No global feature standardization is applied for XGBoost inference path.
- Tree-based models are generally robust to monotonic scale differences, simplifying production inference consistency.

### 6.4 Schema Handling

Dynamic feature modes based on model expectation (n_features_in_):

- 3, 4, 5, 6, or 8 feature schemas.

Purpose:

- Preserves compatibility with legacy and extended model artifacts without breaking runtime contracts.

---

## 7. Feature Importance Analysis

### 7.1 SHAP Output Interpretation

- SHAP returns ranked per-feature contributions for each prediction.
- Ranking by absolute magnitude identifies dominant drivers.

### 7.2 Impact Patterns

Common directional trends:

- Higher slope often contributes positively to risk.
- Higher vegetation often contributes negatively to risk.
- Rainfall and ruin/boulder/structure signatures can elevate risk depending on context.

### 7.3 Interpretation Example

Example contribution pattern:

- slope: +0.19
- ruins: +0.11
- rainfall: +0.08
- vegetation: -0.14

Interpretation:

- Terrain instability and exposed structure signals outweigh protective vegetation effect, resulting in elevated risk.

---

## 8. Performance Analysis

### 8.1 Strengths

- Strong XGBoost classification performance with balanced error profile.
- High detection precision for reliable visual cues.
- Segmentation quality sufficient for stable feature extraction.
- Lightweight tabular inference path supports low-latency risk scoring.

### 8.2 Weaknesses

- Detection recall indicates missed-object risk in hard scenes.
- Segmentation boundary errors can propagate to feature ratios.
- External API variability can degrade geospatial feature fidelity.

### 8.3 Bias and Variance Discussion

- Bias considerations:
  - Underrepresented terrain regimes may bias both CV and tabular components.
- Variance considerations:
  - Cross-validation spread indicates moderate split sensitivity.
- Practical conclusion:
  - Current model family is suitable for decision support but requires continuous data enrichment and drift monitoring.

---

## 9. Design Decisions

### 9.1 Why XGBoost Over Neural Tabular Models

- Better sample efficiency for compact engineered datasets.
- Strong interpretability and SHAP integration.
- Faster inference with lower operational complexity.

### 9.2 Why Segmentation + Detection Combination

- Detection provides object-level localization.
- Segmentation provides dense area-level composition.
- Combined evidence improves both human interpretability and feature robustness.

### 9.3 Why SHAP

- Provides mathematically grounded local attribution.
- Converts model output into auditable feature-level rationale.
- Supports both engineering diagnostics and reviewer-facing transparency.

---

## 10. Graphs and Visualizations

### 10.1 Confusion Matrix

What it represents:

- Classification outcome distribution (TP, TN, FP, FN).

Why it matters:

- Reveals operational error modes not visible from single summary metrics.

Reference artifact:

- [artifacts/model_metrics_20260329/xgboost_erosion/confusion_matrix_eval.png](artifacts/model_metrics_20260329/xgboost_erosion/confusion_matrix_eval.png)

### 10.2 Feature Importance and SHAP Visuals

What they represent:

- Global or local contribution ranking across engineered features.

Why they matter:

- Explain prediction mechanics and guide feature/data improvement strategy.

Reference artifacts:

- [terrain_model/feature_importance.png](terrain_model/feature_importance.png)
- [artifacts/model_metrics_20260329/xgboost_erosion/metrics_report.md](artifacts/model_metrics_20260329/xgboost_erosion/metrics_report.md)

### 10.3 Training Curves (Detection)

What they represent:

- Learning dynamics over epochs for precision, recall, and mAP-related signals.

Why they matter:

- Identify convergence behavior, underfitting/overfitting risk, and checkpoint quality.

Reference artifact:

- [artifacts/model_metrics_20260329/yolov8s_archaeology2/training_curves_custom.png](artifacts/model_metrics_20260329/yolov8s_archaeology2/training_curves_custom.png)

### 10.4 Segmentation Evaluation Visuals

What they represent:

- Per-class segmentation quality and confusion structure.

Why they matter:

- Directly tied to quality of ratio-based feature computation.

Reference artifacts:

- [artifacts/model_metrics_20260329/deeplabv3plus_segmentation/segmentation_per_class_scores.png](artifacts/model_metrics_20260329/deeplabv3plus_segmentation/segmentation_per_class_scores.png)
- [artifacts/model_metrics_20260329/deeplabv3plus_segmentation/segmentation_confusion_matrix.png](artifacts/model_metrics_20260329/deeplabv3plus_segmentation/segmentation_confusion_matrix.png)

---

## 11. Limitations

### 11.1 Data Limitations

- Dataset size and geographic diversity constrain broad generalization claims.
- Rare terrain contexts may be underrepresented in training distribution.

### 11.2 Model Constraints

- Segmentation and detection errors propagate into engineered feature space.
- Slope is currently a lightweight approximation strategy rather than full DEM-derived gradient field.

### 11.3 API Dependency

- External geospatial services introduce availability and latency variability.
- Deterministic fallback mechanisms preserve continuity but may reduce predictive fidelity under prolonged provider degradation.

---

## Key Performance Insights

- The erosion model demonstrates strong balanced classification with stable generalization.
- The detection model prioritizes precision over recall, making it suitable for analyst-assisted workflows.
- Segmentation quality is sufficient for reliable feature extraction.
- Overall system achieves a strong trade-off between accuracy, interpretability, and latency.

---

## Model Selection Justification

Compared to deep neural networks for tabular data, XGBoost offers:

- Better performance on small-to-medium datasets.
- Faster inference.
- Easier interpretability via SHAP.

---

## Latency Considerations

- CV inference: moderate (model-dependent).
- Feature extraction: low.
- XGBoost prediction: very low.
- Overall system optimized for near real-time interaction.

---

## Scalability Considerations

- Python worker pooling can support concurrent requests.
- API caching reduces external dependency load.
- Model loading is optimized via persistent processes.

---

## Closing Note

This document is intended as an interview-ready and review-ready technical reference.It captures metric interpretation, algorithmic depth, and system reasoning required for engineering evaluation and production roadmap planning.

This system demonstrates how combining computer vision, tabular machine learning, and explainability can deliver production-grade, interpretable geospatial intelligence for real-world erosion risk decision support.
