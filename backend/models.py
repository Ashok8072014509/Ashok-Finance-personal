from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import date, datetime

class LineModel(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    badge_color: Optional[str] = "#DC2626"

class DailyEntryBase(BaseModel):
    entry_date: date
    line_id: str
    income: float = Field(default=0.0, ge=0.0)
    outgoing: float = Field(default=0.0, ge=0.0)
    notes: Optional[str] = None

class DailyEntryCreate(DailyEntryBase):
    pass

class DailyEntryUpdate(BaseModel):
    entry_date: Optional[date] = None
    line_id: Optional[str] = None
    income: Optional[float] = Field(default=None, ge=0.0)
    outgoing: Optional[float] = Field(default=None, ge=0.0)
    notes: Optional[str] = None

class DailyEntryResponse(DailyEntryBase):
    id: str
    net_amount: float
    line_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class BagSettingsModel(BaseModel):
    starting_bag: float = Field(default=3000000.0, ge=0.0)
    line_starting_bags: Dict[str, float] = Field(default_factory=lambda: {
        "morning": 1000000.0,
        "evening_1": 1000000.0,
        "evening_2": 1000000.0
    })
    currency: str = "INR"
    notes: Optional[str] = "Ashok Finance Bag Capital"
    updated_at: Optional[datetime] = None

class BagSettingsUpdate(BaseModel):
    starting_bag: Optional[float] = Field(default=None, ge=0.0)
    line_id: Optional[str] = None  # None or "all" or specific line_id ("morning", "evening_1", "evening_2")
    line_starting_bags: Optional[Dict[str, float]] = None
    notes: Optional[str] = None

class LineSummary(BaseModel):
    line_id: str
    line_name: str
    starting_bag: float = 1000000.0
    current_bag: float = 1000000.0
    total_income: float = 0.0
    total_outgoing: float = 0.0
    net_amount: float = 0.0
    today_income: float = 0.0
    today_outgoing: float = 0.0
    today_net: float = 0.0
    month_income: float = 0.0
    month_outgoing: float = 0.0
    month_net: float = 0.0
    growth_amount: float = 0.0
    growth_percent: float = 0.0
    entries_count: int = 0

class BagStatusResponse(BaseModel):
    starting_bag: float
    current_bag: float
    total_income: float
    total_outgoing: float
    total_net: float
    today_income: float
    today_outgoing: float
    today_net: float
    month_income: float = 0.0
    month_outgoing: float = 0.0
    month_net: float = 0.0
    growth_amount: float = 0.0
    growth_percent: float = 0.0
    lines_summary: List[LineSummary]
    line_starting_bags: Dict[str, float] = Field(default_factory=dict)
    total_entries: int
    as_of: datetime


class FilterParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    line_id: Optional[str] = None

