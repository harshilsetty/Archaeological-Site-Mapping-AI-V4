# Future Work

## 1) Data and Geospatial Fidelity

### DEM Integration

- Replace point-based slope proxy with DEM-based terrain gradients.
- Compute slope/aspect/curvature from raster neighborhoods.
- Improve spatial realism for erosion risk modeling.

### Soil Data Enrichment

- Integrate richer soil datasets with depth-aware and texture-aware features.
- Move from coarse class encoding to calibrated continuous descriptors.

## 2) Model Improvements

### Multi-region Scaling

- Train and validate across multiple archaeological geographies.
- Add domain adaptation to reduce region-specific bias.

### Better Calibration

- Add probability calibration (Platt/Isotonic) for erosion classifier.
- Track calibration metrics in production artifact pipeline.

### Ensemble Strategies

- Explore detector/segmenter ensembles for robust performance under varying image quality.

## 3) Explainability and Decision Support

- Add global explainability summaries alongside local SHAP outputs.
- Track explanation stability across repeated runs.
- Build uncertainty-aware narrative templates.

## 4) Engineering and Deployment

### SaaS Deployment Path

- Containerize backend worker and API services.
- Introduce managed model registry and artifact versioning.
- Deploy with autoscaling and observability stack.

### MLOps

- CI checks for model artifact integrity and schema compatibility.
- Data drift and prediction drift monitoring.
- Scheduled retraining and benchmark regression tests.

## 5) Product and UX Expansion

- Team workspaces and project-level report management.
- GIS export formats (GeoJSON/tiles) for external mapping tools.
- Mobile-friendly field mode for survey teams.
