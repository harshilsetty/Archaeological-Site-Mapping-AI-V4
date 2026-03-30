# External APIs and Data Resilience

## 1) APIs Used

### Elevation API

- Service: Open-Elevation
- Purpose: fetch elevation at latitude/longitude
- Usage: slope proxy and elevation feature generation

### Rainfall API

- Service: Open-Meteo
- Purpose: fetch precipitation information
- Usage: rainfall feature in erosion model

### Soil API

- Service: SoilGrids
- Purpose: infer soil texture proxy from location
- Usage: categorical soil feature for erosion modeling

## 2) Data Fetch Flow

1. User provides coordinates (manual/map/EXIF).
2. System queries elevation/rainfall/soil endpoints.
3. Responses are parsed and transformed into model features.
4. Features are merged with CV-derived ratios for final inference.

## 3) Fallback Mechanisms

The application is designed to continue inference even when external services fail.

Fallback strategy includes:

- request timeout limits,
- try/except wrappers around API calls,
- default random/safe fallback values when remote fetch fails,
- no hard crash behavior in UI pipelines.

This ensures high availability for demonstration and offline-constrained scenarios.

## 4) Operational Considerations

- External API latency affects end-to-end response time.
- API outages can degrade feature quality but not necessarily stop execution.
- For production, replace random fallback with deterministic policy defaults and event logging.

## 5) Recommended Hardening

- Add request retry with exponential backoff.
- Add response schema validation.
- Cache repeated requests by coordinate grid.
- Persist API health and fallback-rate metrics.
- Add secrets management for providers requiring keys.
