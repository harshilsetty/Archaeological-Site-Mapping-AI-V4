# Changelog

All notable changes to this project should be documented in this file.

## [Unreleased]

### Added

- Modular project documentation system:
  - `README.md`
  - `METRICS.md`
  - `ARCHITECTURE.md`
  - `FEATURES.md`
  - `MODELS.md`
  - `EXPLAINABILITY.md`
  - `API.md`
  - `UI_UX.md`
  - `FUTURE_WORK.md`
  - `CONTRIBUTING.md`
  - `CHANGELOG.md`
- Production metrics artifact pipeline:
  - `scripts/reporting/generate_production_artifacts.py`
  - output under `artifacts/model_metrics_20260329/`

### Changed

- Repository reorganized to modular structure (`scripts/`, `models/`, `config/`, `docs/reports/`).
- Detection training now resolves dataset config from `config/data.yaml` with fallback.

### Documentation

- Technical report paths synchronized with new folder layout.
- Terrain dataset provenance tracking introduced.

## [Previous]

- Initial project implementation of detection, segmentation, erosion modeling, SHAP explainability, and UI layers.
