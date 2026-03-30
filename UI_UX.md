# UI / UX Documentation

## 1) Design Philosophy

The interface is designed to be:

- minimal in cognitive load,
- information-dense where needed,
- progressive in disclosure (show summary first, details on demand),
- actionable for both technical and non-technical users.

## 2) Layout Structure

### Streamlit Experience

- Input panel: upload image and set location
- Controls: thresholding and model display options
- Output panels:
  - detection overlay
  - segmentation overlay
  - combined map
  - risk metrics and interpretation

### Next.js Experience

- Browser-first layout with modern componentized sections
- API-driven predictions via Python worker bridge
- Client-side interaction flow optimized for exploration and comparison

## 3) User Flow

1. Upload image.
2. Select coordinates (manual/map/EXIF).
3. Trigger inference.
4. Compare visual overlays.
5. Inspect risk probability and SHAP-driven explanation.
6. Export or capture findings.

## 4) Why Collapsible / Expandable Sections

Collapsible sections are used to:

- avoid overwhelming new users,
- keep advanced technical details accessible,
- maintain visual hierarchy between summary and diagnostics.

This supports both quick usage and deep technical inspection.

## 5) UX Decisions that Support Trust

- Side-by-side visual evidence (detection + segmentation)
- Numeric confidence/risk values next to visual output
- Explainability integrated with prediction (not separated)
- Fallback-safe behavior when APIs are unavailable

## 6) Future UX Enhancements

- session comparison between locations/images
- confidence and threshold sensitivity sliders with live charts
- report export templates for field workflows
- accessibility pass (contrast, keyboard flow, screen-reader hints)
