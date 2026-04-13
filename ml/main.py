"""
Havenly ML Recommendation API
==============================
FastAPI server that wraps the KNN hostel recommender and NLP preference
extractor so the frontend can call it over HTTP.

Usage:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os, sys, traceback

# ── import the existing ML modules ────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))
from knn_hostel_model import HostelRecommender
from enhanced_preference_extraction import EnhancedPreferenceExtractor

# ── Boot-time model loading (once) ────────────────────────────────────────────
DATA_PATH = os.path.join(os.path.dirname(__file__), "CUSAT_Private_Hostels_ML_Updated.xlsx")

recommender = HostelRecommender(data_path=DATA_PATH)
recommender.load_data()
recommender.preprocess_data()
recommender.prepare_features()

extractor = EnhancedPreferenceExtractor()

print("\n✅  ML model ready — listening for /recommend requests\n")

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="Havenly ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    text: str
    k: Optional[int] = 5


class HostelResult(BaseModel):
    id: Optional[int] = None
    name: str
    hostelType: Optional[str] = None
    distance: Optional[float] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    safetyScore: Optional[float] = None
    matchScore: float
    address: Optional[str] = None
    topMatches: Optional[List[dict]] = None


class RecommendResponse(BaseModel):
    understood: str
    results: List[HostelResult]
    preferences: dict


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"ok": True, "message": "ML API is running"}


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    try:
        # 1. Extract structured preferences from natural language
        prefs, warnings = extractor.extract_and_validate(req.text)

        # 2. Run KNN recommender
        k = max(1, min(req.k or 5, 10))
        results_df = recommender.recommend(prefs.copy(), k=k, show_details=False)

        if results_df.empty:
            return RecommendResponse(
                understood="I couldn't find hostels matching those criteria. Try relaxing your filters.",
                results=[],
                preferences=prefs,
            )

        # 3. Build human-readable "understood" summary
        parts = []
        if prefs.get("hostel_type"):
            parts.append(f"type: **{prefs['hostel_type']}**")
        if prefs.get("Distance_from_CUSAT_km"):
            parts.append(f"within **{prefs['Distance_from_CUSAT_km']} km**")
        if prefs.get("Estimated_Monthly_Rent"):
            val = int(prefs["Estimated_Monthly_Rent"])
            parts.append(f"budget **₹{val:,}**")
        if prefs.get("Safety_Score"):
            parts.append(f"safety **{prefs['Safety_Score']}+**")

        understood = (
            f"I understood: {', '.join(parts)}. Here are my top picks:"
            if parts
            else "Here are some top-rated hostels for you:"
        )

        # 4. Serialize results
        hostel_list = []
        for _, row in results_df.iterrows():
            # match_score is 0-1 from the model; convert to 0-100 %
            raw_score = float(row.get("match_score", 0.5))
            pct = round(raw_score * 100)

            explanation = row.get("explanation", {})
            top_matches = explanation.get("top_matches", []) if isinstance(explanation, dict) else []

            hostel_list.append(
                HostelResult(
                    id=int(row.get("ID", 0)) if row.get("ID") else None,
                    name=str(row.get("Name", "Unknown")),
                    hostelType=str(row.get("Hostel_Type", "")).strip() or None,
                    distance=float(row["Distance_from_CUSAT_km"]) if row.get("Distance_from_CUSAT_km") is not None else None,
                    price=float(row["Estimated_Monthly_Rent"]) if row.get("Estimated_Monthly_Rent") is not None else None,
                    rating=float(row["Rating"]) if row.get("Rating") is not None else None,
                    safetyScore=float(row["Safety_Score"]) if row.get("Safety_Score") is not None else None,
                    matchScore=pct,
                    address=str(row.get("Address", "")) or None,
                    topMatches=top_matches,
                )
            )

        return RecommendResponse(understood=understood, results=hostel_list, preferences=prefs)

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))
