# Models

## 1) Detection Models

### YOLOv8s (Primary)

- Role: production detection backbone
- Base checkpoint: `models/yolov8s.pt`
- Trained checkpoint: `runs/detect/yolov8s_archaeology2/weights/best.pt`
- Training script: `scripts/training/train_seg.py`
- Key final metrics:
  - Precision: 0.8998
  - Recall: 0.7201
  - mAP@50: 0.8321
  - mAP@50-95: 0.5861

### YOLOv8n (Lightweight baseline)

- Base checkpoint: `models/yolov8n.pt`
- Trained checkpoint: `runs/detect/train2/weights/best.pt`
- Key final metrics:
  - Precision: 0.6951
  - Recall: 0.5490
  - mAP@50: 0.6218
  - mAP@50-95: 0.3861

### YOLO11n (Base checkpoint)

- File: `models/yolo11n.pt`
- Current repo status: base-only benchmark metadata (no local training-run CSV found)

## 2) Segmentation Model

### DeepLabV3+ (ResNet34 encoder)

- Checkpoint: `models/deeplab_model.pth`
- Training script: `scripts/training/train_deeplab_seg.py`
- Architecture: encoder-decoder semantic segmentation
- Loss design in training script:
  - 0.6 * CrossEntropy
  - 0.4 * Soft Dice loss
- Validation metrics (current evaluation pack):
  - Pixel Accuracy: 0.7975
  - Macro IoU: 0.6229
  - Macro Dice: 0.7652

## 3) Erosion Model

### XGBoost Classifier

- Model file: `terrain_model/erosion_model.pkl`
- Training script: `terrain_model/train_xgboost.py`
- Dataset: `terrain_model/erosion_dataset.csv`
- Primary features:
  - slope, vegetation, elevation, rainfall, soil, boulders, ruins, structures

Performance (holdout):

- Accuracy: 0.9050
- Precision: 0.9091
- Recall: 0.9000
- F1: 0.9045
- ROC-AUC: 0.9660

## 4) Model Selection Rationale

- YOLOv8s chosen for stronger detection quality in this dataset.
- DeepLabV3+ chosen for stable segmentation and explainable mask output.
- XGBoost chosen for high performance on compact tabular features and strong compatibility with SHAP.

## 5) Training and Inference Artifacts

- Production artifact package: `artifacts/model_metrics_20260329/`
- Per-model reports and machine-readable summaries:
  - `metrics_report.md`
  - `metrics_summary.json`

## 6) Operational Characteristics

- YOLOv8n is faster on CPU than YOLOv8s but less accurate.
- DeepLabV3+ has the largest model size and highest CPU latency among core models.
- XGBoost is extremely lightweight and fast for inference.
