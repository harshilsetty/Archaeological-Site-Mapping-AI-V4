# Feature Engineering

This document explains how raw image and geospatial signals become model-ready features for erosion risk prediction.

## 1) Feature Categories

### A) Visual Surface Features (from segmentation)

- `vegetation` or `vegetation_ratio`
- `boulders` or `boulders_ratio`
- `ruins` or `ruins_ratio`
- `structures` or `structures_ratio`

These features capture semantic composition of terrain in the observed region.

### B) Geo-Context Features

- `slope`
- `elevation`
- `rainfall`
- `soil` (encoded class)

These features capture environmental conditions linked to erosion susceptibility.

## 2) Core Calculations

### Ratio Features

For any class `c` in segmentation mask:

\[
\text{ratio}_c = \frac{\text{pixels of class } c}{\text{total pixels in mask}}
\]

Interpretation:

- Higher vegetation ratio generally reduces erosion tendency.
- Higher exposed/bare/structural surfaces can increase erosion risk depending on context.

### Slope Approximation

The app pipeline uses local elevation differences around the selected coordinate:

\[
\Delta x = |e(lat+\delta, lon) - e(lat, lon)|,
\quad
\Delta y = |e(lat, lon+\delta) - e(lat, lon)|
\]

\[
\text{slope proxy} = \frac{\Delta x + \Delta y}{2}
\]

This is a practical proxy when full DEM grids are not available.

### Erosion Risk Probability

Given engineered vector \(x\), XGBoost outputs:

\[
p(erosion=1 \mid x)
\]

Decision thresholding maps probability to risk classes for UI display.

## 3) Feature Schema Variants

The project supports multiple model schemas (legacy and current), including:

- 3-feature: slope, vegetation, elevation
- 4-feature: slope, vegetation, ruins, elevation
- 5-feature: slope, vegetation, elevation, rainfall, soil
- 6-feature: slope, vegetation, elevation, boulders, ruins, structures
- 8-feature: slope, vegetation, elevation, rainfall, soil, boulders, ruins, structures

At inference time, schema is selected based on model expectation (`n_features_in_`).

## 4) Why These Features

- Visual composition captures on-ground material and cover state.
- Terrain and climate proxies add process-level erosion signals.
- Combined feature set is compact, interpretable, and deployable.

## 5) Practical Notes

- API outages are handled with fallback defaults to keep inference stable.
- Feature naming differs slightly across legacy scripts; production docs use normalized names.
- Dataset provenance for synthetic terrain data is tracked in `terrain_model/erosion_dataset_provenance.json`.
