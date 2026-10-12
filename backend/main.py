import os
from datetime import date
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    DailyEntryCreate,
    DailyEntryUpdate,
    BagSettingsUpdate,
    BagStatusResponse,
)
from database import db, DEFAULT_LINES
from pdf_service import generate_financial_pdf

app = FastAPI(
    title="Ashok Finance API",
    description="Backend service for Ashok Finance tracking 3 distinct lines and ₹10 Lakhs Bag capital balance.",
    version="1.0.0"
)

# CORS configuration for local development and Render/Vercel production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "app": "Ashok Finance Backend API",
        "status": "online",
        "lines": [l["name"] for l in DEFAULT_LINES],
        "default_bag_capital": "INR 10,00,000 (10 Lakhs)",
        "docs_url": "/docs"
    }

# ----------------- LINES -----------------
@app.get("/api/lines")
def get_lines():
    return db.get_lines()

# ----------------- BAG SETTINGS & STATUS -----------------
@app.get("/api/bag")
def get_bag_status():
    return db.get_bag_status()

@app.get("/api/bag/settings")
def get_bag_settings():
    return db.get_bag_settings()

@app.post("/api/bag/settings")
def update_bag_settings(payload: BagSettingsUpdate):
    updated = db.update_bag_settings(payload.starting_bag, payload.notes)
    status = db.get_bag_status()
    return {"message": "Bag settings updated successfully", "settings": updated, "status": status}

# ----------------- ENTRIES CRUD -----------------
@app.get("/api/entries")
def get_entries(
    start_date: Optional[date] = Query(None, description="Start date filter YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="End date filter YYYY-MM-DD"),
    line_id: Optional[str] = Query(None, description="Line identifier: morning, evening_1, evening_2, or all")
):
    entries = db.get_entries(start_date=start_date, end_date=end_date, line_id=line_id)
    return entries

@app.post("/api/entries")
def create_entry(payload: DailyEntryCreate):
    entry = db.create_entry(
        entry_date=payload.entry_date,
        line_id=payload.line_id,
        income=payload.income,
        outgoing=payload.outgoing,
        notes=payload.notes
    )
    status = db.get_bag_status()
    return {
        "message": "Entry created successfully",
        "entry": entry,
        "bag_status": status
    }

@app.put("/api/entries/{entry_id}")
def update_entry(entry_id: str, payload: DailyEntryUpdate):
    updated = db.update_entry(
        entry_id=entry_id,
        entry_date=payload.entry_date,
        line_id=payload.line_id,
        income=payload.income,
        outgoing=payload.outgoing,
        notes=payload.notes
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Entry not found")
    status = db.get_bag_status()
    return {
        "message": "Entry updated successfully",
        "entry": updated,
        "bag_status": status
    }

@app.delete("/api/entries/{entry_id}")
def delete_entry(entry_id: str):
    success = db.delete_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found or already deleted")
    status = db.get_bag_status()
    return {
        "message": "Entry deleted successfully",
        "bag_status": status
    }

# ----------------- PDF REPORT DOWNLOAD -----------------
@app.get("/api/reports/pdf")
def download_pdf_report(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    line_id: Optional[str] = Query(None)
):
    entries = db.get_entries(start_date=start_date, end_date=end_date, line_id=line_id)
    bag_status = db.get_bag_status()
    
    line_lookup = {l["id"]: l["name"] for l in db.get_lines()}
    line_name = line_lookup.get(line_id) if line_id and line_id != "all" else None
    
    label = "All Time"
    if start_date and end_date:
        label = f"{start_date.isoformat()} to {end_date.isoformat()}"
    elif start_date:
        label = f"From {start_date.isoformat()}"
    elif end_date:
        label = f"Up to {end_date.isoformat()}"

    pdf_bytes = generate_financial_pdf(
        bag_status=bag_status,
        entries=entries,
        filter_label=label,
        start_date=start_date,
        end_date=end_date,
        line_name_filter=line_name
    )

    filename = f"Ashok_Finance_Report_{date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
