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
    starting_bag: float = Field(default=1000000.0, ge=0.0)
    currency: str = "INR"
    notes: Optional[str] = "Initial Bag Capital"
    updated_at: Optional[datetime] = None

class BagSettingsUpdate(BaseModel):
    starting_bag: float = Field(..., ge=0.0)
    notes: Optional[str] = None

class LineSummary(BaseModel):
    line_id: str
    line_name: str
    total_income: float
    total_outgoing: float
    net_amount: float
    entries_count: int

class BagStatusResponse(BaseModel):
    starting_bag: float
    current_bag: float
    total_income: float
    total_outgoing: float
    total_net: float
    today_income: float
    today_outgoing: float
    today_net: float
    lines_summary: List[LineSummary]
    total_entries: int
    as_of: datetime

class FilterParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    line_id: Optional[str] = None
