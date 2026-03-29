# Metrics Summary

_Last updated: 2026-03-27_

## Terrain Erosion Model (XGBoost)
Source: `terrain_model/train_xgboost.py` + `terrain_model/artifacts/xgboost_classification_report.txt`

- Accuracy: **0.9050**
- RMSE (probability vs label): **0.272105**
- R2 (probability vs label): **0.703835**

Classification report:

- Class 0:
  - Precision: **0.90**
  - Recall: **0.91**
  - F1-score: **0.91**
  - Support: **100**
- Class 1:
  - Precision: **0.91**
  - Recall: **0.90**
  - F1-score: **0.90**
  - Support: **100**
- Macro avg:
  - Precision: **0.91**
  - Recall: **0.91**
  - F1-score: **0.90**
- Weighted avg:
  - Precision: **0.91**
  - Recall: **0.91**
  - F1-score: **0.90**

Confusion matrix:

- True 0 predicted 0: **91**
- True 0 predicted 1: **9**
- True 1 predicted 0: **10**
- True 1 predicted 1: **90**

## Terrain Erosion Cross-Validation
Source: `terrain_model/validate_model.py`

- CV Accuracy scores: **[0.920, 0.885, 0.855, 0.875, 0.875]**
- Mean CV Accuracy: **0.882**

- CV RMSE scores: **[0.2828, 0.3391, 0.3808, 0.3536, 0.3536]**
- Mean CV RMSE: **0.3420**

- CV R2 scores: **[0.68, 0.54, 0.42, 0.50, 0.50]**
- Mean CV R2: **0.528**

## Detection Model (YOLOv8s)
Source: `runs/detect/yolov8s_archaeology2/results.csv`

Final epoch metrics (epoch 80):

- Precision (B): **0.89978**
- Recall (B): **0.72010**
- mAP50 (B): **0.83206**
- mAP50-95 (B): **0.58611**

Best-run highlights:

- Best mAP50-95 (B): **0.58673** at epoch **78**
- Best Precision (B): **0.89978** at epoch **80**
- Best Recall (B): **0.76738** at epoch **62**

## Notes

- RMSE and R2 are now included for the terrain erosion milestone evaluation.
- Erosion metrics are classification-based with probability-aware RMSE/R2 tracking.
