import os
import sqlite3
import uuid
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

DEFAULT_LINES = [
    {
        "id": "morning",
        "name": "ASHOK FINANCE MORNING",
        "description": "Morning Collection & Loan Line",
        "badge_color": "#DC2626",
    },
    {
        "id": "evening_1",
        "name": "ASHOK FINANCE EVENING 1",
        "description": "Evening Line 1 Collection & Disbursement",
        "badge_color": "#B91C1C",
    },
    {
        "id": "evening_2",
        "name": "ASHOK FINANCE EVENING 2",
        "description": "Evening Line 2 Collection & Disbursement",
        "badge_color": "#991B1B",
    },
]

DEFAULT_STARTING_BAG = 1000000.0  # 10 Lakhs

class DatabaseManager:
    def __init__(self):
        self.supabase_client = None
        if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL.startswith("http"):
            try:
                from supabase import create_client
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print(f"[Database] Connected to Supabase at {SUPABASE_URL}")
            except Exception as e:
                print(f"[Database] Could not connect to Supabase: {e}. Falling back to SQLite.")
                self.supabase_client = None
        else:
            print("[Database] Supabase credentials not set or placeholder detected. Operating with SQLite.")

        self.sqlite_db_path = os.path.join(os.path.dirname(__file__), "ashok_finance.db")
        self._init_sqlite()

    def _get_connection(self):
        conn = sqlite3.connect(self.sqlite_db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Lines table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS lines (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    badge_color TEXT DEFAULT '#DC2626',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Bag settings
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bag_settings (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    starting_bag REAL NOT NULL DEFAULT 1000000.0,
                    currency TEXT NOT NULL DEFAULT 'INR',
                    notes TEXT DEFAULT 'Initial Bag amount of 10 Lakhs',
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Daily entries
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS daily_entries (
                    id TEXT PRIMARY KEY,
                    entry_date TEXT NOT NULL,
                    line_id TEXT NOT NULL,
                    income REAL NOT NULL DEFAULT 0.0,
                    outgoing REAL NOT NULL DEFAULT 0.0,
                    net_amount REAL NOT NULL DEFAULT 0.0,
                    notes TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (line_id) REFERENCES lines(id)
                )
            """)

            # Seed lines if missing
            for line in DEFAULT_LINES:
                cursor.execute("""
                    INSERT OR IGNORE INTO lines (id, name, description, badge_color)
                    VALUES (?, ?, ?, ?)
                """, (line["id"], line["name"], line["description"], line["badge_color"]))

            # Seed initial bag settings
            cursor.execute("""
                INSERT OR IGNORE INTO bag_settings (id, starting_bag, currency, notes)
                VALUES (1, ?, 'INR', 'Ashok Finance Initial Bag Capital (10 Lakhs)')
            """, (DEFAULT_STARTING_BAG,))
            conn.commit()

    # ------------------ LINES ------------------
    def get_lines(self) -> List[Dict[str, Any]]:
        if self.supabase_client:
            try:
                res = self.supabase_client.table("lines").select("*").order("id").execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase error in get_lines]: {e}")

        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM lines ORDER BY id").fetchall()
            return [dict(r) for r in rows]

    # ------------------ BAG SETTINGS ------------------
    def get_bag_settings(self) -> Dict[str, Any]:
        if self.supabase_client:
            try:
                res = self.supabase_client.table("bag_settings").select("*").eq("id", 1).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase error in get_bag_settings]: {e}")

        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM bag_settings WHERE id = 1").fetchone()
            if row:
                return dict(row)
            return {"id": 1, "starting_bag": DEFAULT_STARTING_BAG, "currency": "INR", "notes": "Initial Bag Capital"}

    def update_bag_settings(self, starting_bag: float, notes: Optional[str] = None) -> Dict[str, Any]:
        now_str = datetime.utcnow().isoformat()
        if self.supabase_client:
            try:
                update_data = {"starting_bag": starting_bag, "updated_at": now_str}
                if notes:
                    update_data["notes"] = notes
                res = self.supabase_client.table("bag_settings").upsert({"id": 1, **update_data}).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase error in update_bag_settings]: {e}")

        with self._get_connection() as conn:
            conn.execute("""
                UPDATE bag_settings 
                SET starting_bag = ?, notes = COALESCE(?, notes), updated_at = ?
                WHERE id = 1
            """, (starting_bag, notes, now_str))
            conn.commit()
            return self.get_bag_settings()

    # ------------------ ENTRIES ------------------
    def get_entries(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None, 
        line_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        line_lookup = {l["id"]: l["name"] for l in self.get_lines()}

        if self.supabase_client:
            try:
                query = self.supabase_client.table("daily_entries").select("*")
                if start_date:
                    query = query.gte("entry_date", start_date.isoformat())
                if end_date:
                    query = query.lte("entry_date", end_date.isoformat())
                if line_id and line_id != "all":
                    query = query.eq("line_id", line_id)
                res = query.order("entry_date", desc=True).order("created_at", desc=True).execute()
                entries = res.data or []
                for entry in entries:
                    entry["line_name"] = line_lookup.get(entry["line_id"], entry["line_id"])
                    # ensure net_amount is populated
                    entry["net_amount"] = float(entry.get("income", 0)) - float(entry.get("outgoing", 0))
                return entries
            except Exception as e:
                print(f"[Supabase error in get_entries]: {e}")

        with self._get_connection() as conn:
            query = "SELECT * FROM daily_entries WHERE 1=1"
            params = []
            if start_date:
                query += " AND entry_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                query += " AND entry_date <= ?"
                params.append(end_date.isoformat())
            if line_id and line_id != "all":
                query += " AND line_id = ?"
                params.append(line_id)
            query += " ORDER BY entry_date DESC, created_at DESC"

            rows = conn.execute(query, params).fetchall()
            entries = []
            for r in rows:
                d = dict(r)
                d["line_name"] = line_lookup.get(d["line_id"], d["line_id"])
                entries.append(d)
            return entries

    def create_entry(self, entry_date: Any, line_id: str, income: float, outgoing: float, notes: Optional[str] = None) -> Dict[str, Any]:
        entry_id = str(uuid.uuid4())
        now_str = datetime.utcnow().isoformat()
        net_amount = round(float(income) - float(outgoing), 2)
        date_str = entry_date.isoformat() if isinstance(entry_date, date) else str(entry_date)

        if self.supabase_client:
            try:
                data = {
                    "id": entry_id,
                    "entry_date": date_str,
                    "line_id": line_id,
                    "income": float(income),
                    "outgoing": float(outgoing),
                    "net_amount": net_amount,
                    "notes": notes,
                    "created_at": now_str,
                    "updated_at": now_str,
                }
                res = self.supabase_client.table("daily_entries").insert(data).execute()
                if res.data:
                    ret = res.data[0]
                    ret["line_name"] = {l["id"]: l["name"] for l in DEFAULT_LINES}.get(line_id, line_id)
                    return ret
            except Exception as e:
                print(f"[Supabase error in create_entry]: {e}")

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO daily_entries (id, entry_date, line_id, income, outgoing, net_amount, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (entry_id, date_str, line_id, float(income), float(outgoing), net_amount, notes, now_str, now_str))
            conn.commit()

        line_lookup = {l["id"]: l["name"] for l in self.get_lines()}
        return {
            "id": entry_id,
            "entry_date": date_str,
            "line_id": line_id,
            "line_name": line_lookup.get(line_id, line_id),
            "income": float(income),
            "outgoing": float(outgoing),
            "net_amount": net_amount,
            "notes": notes,
            "created_at": now_str,
            "updated_at": now_str,
        }

    def update_entry(self, entry_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        now_str = datetime.utcnow().isoformat()
        existing = None

        if self.supabase_client:
            try:
                res = self.supabase_client.table("daily_entries").select("*").eq("id", entry_id).execute()
                if res.data:
                    existing = res.data[0]
            except Exception as e:
                print(f"[Supabase check in update_entry]: {e}")

        if not existing:
            with self._get_connection() as conn:
                row = conn.execute("SELECT * FROM daily_entries WHERE id = ?", (entry_id,)).fetchone()
                if row:
                    existing = dict(row)

        if not existing:
            return None

        # Prepare updated fields
        income = kwargs.get("income")
        if income is None:
            income = existing.get("income", 0.0)
        else:
            income = float(income)

        outgoing = kwargs.get("outgoing")
        if outgoing is None:
            outgoing = existing.get("outgoing", 0.0)
        else:
            outgoing = float(outgoing)

        net_amount = round(income - outgoing, 2)

        entry_date = kwargs.get("entry_date") or existing.get("entry_date")
        if isinstance(entry_date, date):
            entry_date = entry_date.isoformat()
        else:
            entry_date = str(entry_date)

        line_id = kwargs.get("line_id") or existing.get("line_id")
        notes = kwargs.get("notes") if kwargs.get("notes") is not None else existing.get("notes")

        update_dict = {
            "entry_date": entry_date,
            "line_id": line_id,
            "income": income,
            "outgoing": outgoing,
            "net_amount": net_amount,
            "notes": notes,
            "updated_at": now_str,
        }

        if self.supabase_client:
            try:
                res = self.supabase_client.table("daily_entries").update(update_dict).eq("id", entry_id).execute()
                if res.data:
                    ret = res.data[0]
                    ret["line_name"] = {l["id"]: l["name"] for l in self.get_lines()}.get(line_id, line_id)
                    return ret
            except Exception as e:
                print(f"[Supabase error in update_entry]: {e}")

        with self._get_connection() as conn:
            conn.execute("""
                UPDATE daily_entries
                SET entry_date = ?, line_id = ?, income = ?, outgoing = ?, net_amount = ?, notes = ?, updated_at = ?
                WHERE id = ?
            """, (entry_date, line_id, income, outgoing, net_amount, notes, now_str, entry_id))
            conn.commit()

        line_lookup = {l["id"]: l["name"] for l in self.get_lines()}
        update_dict["id"] = entry_id
        update_dict["line_name"] = line_lookup.get(line_id, line_id)
        return update_dict

    def delete_entry(self, entry_id: str) -> bool:
        if self.supabase_client:
            try:
                res = self.supabase_client.table("daily_entries").delete().eq("id", entry_id).execute()
                if res.data:
                    return True
            except Exception as e:
                print(f"[Supabase error in delete_entry]: {e}")

        with self._get_connection() as conn:
            cursor = conn.execute("DELETE FROM daily_entries WHERE id = ?", (entry_id,))
            conn.commit()
            return cursor.rowcount > 0

    # ------------------ BAG STATUS ------------------
    def get_bag_status(self) -> Dict[str, Any]:
        settings = self.get_bag_settings()
        starting_bag = float(settings.get("starting_bag", DEFAULT_STARTING_BAG))
        all_entries = self.get_entries()

        total_income = 0.0
        total_outgoing = 0.0
        today_income = 0.0
        today_outgoing = 0.0
        today_str = date.today().isoformat()

        lines = self.get_lines()
        lines_summary = {
            l["id"]: {
                "line_id": l["id"],
                "line_name": l["name"],
                "total_income": 0.0,
                "total_outgoing": 0.0,
                "net_amount": 0.0,
                "entries_count": 0,
            }
            for l in lines
        }

        for e in all_entries:
            inc = float(e.get("income", 0.0))
            out = float(e.get("outgoing", 0.0))
            total_income += inc
            total_outgoing += out

            e_date = str(e.get("entry_date", ""))
            if e_date == today_str:
                today_income += inc
                today_outgoing += out

            lid = e.get("line_id")
            if lid in lines_summary:
                lines_summary[lid]["total_income"] += inc
                lines_summary[lid]["total_outgoing"] += out
                lines_summary[lid]["net_amount"] += (inc - out)
                lines_summary[lid]["entries_count"] += 1

        total_net = round(total_income - total_outgoing, 2)
        current_bag = round(starting_bag + total_net, 2)
        today_net = round(today_income - today_outgoing, 2)

        return {
            "starting_bag": starting_bag,
            "current_bag": current_bag,
            "total_income": round(total_income, 2),
            "total_outgoing": round(total_outgoing, 2),
            "total_net": total_net,
            "today_income": round(today_income, 2),
            "today_outgoing": round(today_outgoing, 2),
            "today_net": today_net,
            "lines_summary": list(lines_summary.values()),
            "total_entries": len(all_entries),
            "as_of": datetime.utcnow().isoformat(),
        }

db = DatabaseManager()
