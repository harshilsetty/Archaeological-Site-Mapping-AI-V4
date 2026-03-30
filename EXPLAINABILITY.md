# Explainability

## 1) Why Explainability Matters

Erosion risk predictions influence field priorities. Teams need to know not only *what* the model predicts, but *why*.

This project uses SHAP to provide feature-level attribution for each prediction.

## 2) What is SHAP

SHAP (SHapley Additive exPlanations) attributes a model prediction to individual input features based on cooperative game theory.

For one prediction:

\[
\hat{y} = \phi_0 + \sum_{i=1}^{n} \phi_i
\]

- \(\phi_0\): base value (expected prediction)
- \(\phi_i\): contribution of feature \(i\)

Positive \(\phi_i\) pushes risk up; negative \(\phi_i\) pushes risk down.

## 3) How SHAP is Used Here

1. Build feature vector used by XGBoost.
2. Run SHAP explainer on that exact vector.
3. Extract top contributors by absolute impact.
4. Show ranked factors in API/UI outputs.

Typical high-impact features may include:

- slope
- vegetation
- rainfall
- boulders / ruins / structures proportions

## 4) Interpreting SHAP Results

- A high positive SHAP value for slope means slope increased predicted erosion risk.
- A negative SHAP value for vegetation means vegetation reduced risk estimate.
- SHAP values are local explanations, not global causality claims.

## 5) SHAP + LLM Integration

The pipeline combines quantitative SHAP output with LLM narrative generation:

1. SHAP provides mathematically grounded attributions.
2. LLM converts those attributions into concise, readable explanations.

This gives both:

- technical transparency for ML practitioners,
- human-friendly interpretation for non-technical users.

## 6) Practical Caveats

- SHAP quality depends on model and feature quality.
- Explanations are prediction-specific.
- API fallback values can affect feature inputs, and therefore SHAP output.

## 7) Output Locations

- SHAP-based interpretation is surfaced in app responses and model artifact summaries.
- Production metrics package: `artifacts/model_metrics_20260329/`
