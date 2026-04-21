import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request


ROOT = Path(__file__).resolve().parent
BRIDGE_DIR = ROOT / "geo-ai-ui" / "server"
if str(BRIDGE_DIR) not in sys.path:
    sys.path.insert(0, str(BRIDGE_DIR))

from predict_bridge import generate_insights, predict, predict_point  # noqa: E402


app = FastAPI(title="Geo AI Prediction Backend", version="1.0.0")


def _to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def _normalize_key(value: Any) -> str:
    key = str(value or "").strip().strip('"').strip("'")
    if key.lower().startswith("bearer "):
        key = key.split(None, 1)[1].strip()
    return "".join(key.split())


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True}


@app.post("/api/predict")
async def api_predict(request: Request, action: str = Query("predict")):
    action = str(action or "predict").strip().lower()

    if action == "point":
        payload = await request.json()
        lat = float(payload.get("lat"))
        lon = float(payload.get("lon"))
        return predict_point(
            lat=lat,
            lon=lon,
            api_key=_normalize_key(payload.get("apiKey") or ""),
            use_ai_insight=_to_bool(payload.get("useAiInsight", False)),
            include_shap=_to_bool(payload.get("includeShap", True)),
            vegetation_ratio=payload.get("vegetation"),
            boulders_ratio=payload.get("boulders"),
            ruins_ratio=payload.get("ruins"),
            structures_ratio=payload.get("structures"),
        )

    if action == "insight":
        payload = await request.json()
        return generate_insights(
            metrics=payload.get("metrics") or {},
            probability=float(payload.get("probability", 0.0)),
            api_key=_normalize_key(payload.get("apiKey") or ""),
            include_ai_insight=_to_bool(payload.get("useAiInsight", True)),
            include_shap=_to_bool(payload.get("includeShap", True)),
        )

    if action not in {"predict", "batch"}:
        raise HTTPException(status_code=400, detail={"error": "Unsupported action"})

    form = await request.form()
    image = form.get("image")

    if action == "batch":
        if image is None:
            raise HTTPException(status_code=400, detail={"error": "Image file is required"})

        points_raw = str(form.get("points") or "[]")
        try:
            parsed_points = json.loads(points_raw)
        except Exception as exc:
            raise HTTPException(status_code=400, detail={"error": f"Invalid points payload: {exc}"})

        if not isinstance(parsed_points, list) or len(parsed_points) == 0:
            raise HTTPException(status_code=400, detail={"error": "At least one point is required"})

        image_bytes = await image.read()
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(str(image.filename or "upload.jpg")).suffix or ".jpg") as tmp:
                tmp.write(image_bytes)
                tmp_path = tmp.name

            confidence = float(form.get("confidence") or 0.25)
            class_visibility = {
                "vegetation": _to_bool(form.get("showVegetation", True)),
                "ruins": _to_bool(form.get("showRuins", True)),
                "structures": _to_bool(form.get("showStructures", True)),
                "boulders": _to_bool(form.get("showBoulders", True)),
                "others": _to_bool(form.get("showOthers", True)),
            }
            use_ai_insight = _to_bool(form.get("useAiInsight", True))
            include_shap = _to_bool(form.get("includeShap", True))
            fast_mode = _to_bool(form.get("fastMode", True))
            api_key = _normalize_key(form.get("apiKey") or "")

            points = []
            for item in parsed_points[:30]:
                lat = float(item.get("lat"))
                lon = float(item.get("lon"))
                data = predict(
                    image_path=tmp_path,
                    lat=lat,
                    lon=lon,
                    api_key=api_key,
                    confidence=confidence,
                    class_visibility=class_visibility,
                    use_ai_insight=use_ai_insight,
                    include_shap=include_shap,
                    fast_mode=fast_mode,
                )
                points.append(
                    {
                        "lat": lat,
                        "lon": lon,
                        "probability": float(data.get("probability", 0.0)),
                        "riskLabel": data.get("riskLabel", "MODERATE"),
                        "explanation": data.get("explanation"),
                        "shap": data.get("shap") or [],
                        "insightMode": data.get("insightMode"),
                        "insightStatus": data.get("insightStatus"),
                    }
                )

            return {"points": points, "truncated": len(parsed_points) > 30}
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    if image is None:
        raise HTTPException(status_code=400, detail={"error": "Image file is required"})

    image_bytes = await image.read()
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(str(image.filename or "upload.jpg")).suffix or ".jpg") as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        lat = float(form.get("lat"))
        lon = float(form.get("lon"))
        confidence = float(form.get("confidence") or 0.25)
        class_visibility = {
            "vegetation": _to_bool(form.get("showVegetation", True)),
            "ruins": _to_bool(form.get("showRuins", True)),
            "structures": _to_bool(form.get("showStructures", True)),
            "boulders": _to_bool(form.get("showBoulders", True)),
            "others": _to_bool(form.get("showOthers", True)),
        }

        return predict(
            image_path=tmp_path,
            lat=lat,
            lon=lon,
            api_key=_normalize_key(form.get("apiKey") or ""),
            confidence=confidence,
            class_visibility=class_visibility,
            use_ai_insight=_to_bool(form.get("useAiInsight", False)),
            include_shap=_to_bool(form.get("includeShap", False)),
            fast_mode=_to_bool(form.get("fastMode", True)),
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)