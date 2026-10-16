import os
import sqlite3
import uuid
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Supabase Credentials & PostgreSQL Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ccvrmvauxkgbydecnfnq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

PG_HOST = os.getenv("SUPABASE_DB_HOST", "db.ccvrmvauxkgbydecnfnq.supabase.co")
PG_USER = os.getenv("SUPABASE_DB_USER", "postgres")
PG_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "Ashok@8072014509")
PG_PORT = int(os.getenv("SUPABASE_DB_PORT", 5432))
PG_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")

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

DEFAULT_STARTING_BAG = 1000000.0  # 10 Lakhs per line = 30 Lakhs combined


from contextlib import contextmanager

# Support unified DATABASE_URL if present (Render/Supabase standard)
DATABASE_URL = os.getenv("DATABASE_URL")

class DatabaseManager:
    def __init__(self):
        self.use_postgres = False
        self.db_status_message = "Initializing..."
        self.sqlite_db_path = os.path.join(os.path.dirname(__file__), "ashok_finance.db")
        self._init_sqlite()
        self.pg_pool = None
        self._cached_lines = None

        # Attempt connection to Supabase PostgreSQL with high-performance connection pool
        try:
            import psycopg2
            from psycopg2 import pool

            db_url = DATABASE_URL or os.getenv("SUPABASE_POSTGRES_URL")
            if db_url:
                if "sslmode=" not in db_url:
                    sep = "&" if "?" in db_url else "?"
                    db_url = f"{db_url}{sep}sslmode=require"
                self.pg_pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=10,
                    dsn=db_url,
                    connect_timeout=6
                )
            else:
                self.pg_pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=10,
                    host=PG_HOST,
                    user=PG_USER,
                    password=PG_PASSWORD,
                    port=PG_PORT,
                    dbname=PG_NAME,
                    sslmode="require",
                    connect_timeout=6
                )

            # Test connection liveness
            with self._get_pg_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")

            self.use_postgres = True
            self.db_status_message = f"Supabase PostgreSQL Live ({PG_HOST})"
            print(f"[Database] Active ThreadedConnectionPool ready for Supabase PostgreSQL at {PG_HOST} (min=1, max=10)")
        except Exception as e:
            self.use_postgres = False
            self.pg_pool = None
            self.db_status_message = f"SQLite Local Fallback ({e})"
            print(f"[Database] PostgreSQL connection failed: {e}. Operating with SQLite local storage.")

    @contextmanager
    def _get_pg_connection(self):
        if not self.pg_pool:
            raise Exception("No active PostgreSQL connection pool")
        conn = self.pg_pool.getconn()
        try:
            if conn.closed:
                conn = self.pg_pool._connect()
            yield conn
        finally:
            if not conn.closed:
                try:
                    conn.commit()
                except Exception:
                    pass
                self.pg_pool.putconn(conn)
            else:
                try:
                    self.pg_pool.putconn(conn, close=True)
                except Exception:
                    pass

    def _get_sqlite_connection(self):
        conn = sqlite3.connect(self.sqlite_db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        with self._get_sqlite_connection() as conn:
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
                    starting_bag REAL NOT NULL DEFAULT 3000000.0,
                    currency TEXT NOT NULL DEFAULT 'INR',
                    notes TEXT DEFAULT 'Combined Bag Capital across 3 lines',
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Line-specific bag settings
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS line_bag_settings (
                    line_id TEXT PRIMARY KEY,
                    starting_bag REAL NOT NULL DEFAULT 1000000.0,
                    notes TEXT,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (line_id) REFERENCES lines(id)
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

            # Seed lines
            for line in DEFAULT_LINES:
                cursor.execute("""
                    INSERT OR IGNORE INTO lines (id, name, description, badge_color)
                    VALUES (?, ?, ?, ?)
                """, (line["id"], line["name"], line["description"], line["badge_color"]))

                cursor.execute("""
                    INSERT OR IGNORE INTO line_bag_settings (line_id, starting_bag, notes)
                    VALUES (?, 1000000.0, ?)
                """, (line["id"], f"{line['name']} Initial Bag Capital (10 Lakhs)"))

            cursor.execute("""
                INSERT OR IGNORE INTO bag_settings (id, starting_bag, currency, notes)
                VALUES (1, 3000000.0, 'INR', 'Ashok Finance Combined Initial Bag Capital (30 Lakhs)')
            """)
            conn.commit()

    # ------------------ LINES ------------------
    def get_lines(self) -> List[Dict[str, Any]]:
        if self._cached_lines:
            return self._cached_lines

        res = None
        if self.use_postgres:
            try:
                from psycopg2.extras import RealDictCursor
                with self._get_pg_connection() as conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute("SELECT id, name, description, badge_color FROM public.lines ORDER BY id")
                        res = [dict(r) for r in cur.fetchall()]
            except Exception as e:
                print(f"[Supabase PG error in get_lines]: {e}")

        if res is None:
            with self._get_sqlite_connection() as conn:
                rows = conn.execute("SELECT id, name, description, badge_color FROM lines ORDER BY id").fetchall()
                res = [dict(r) for r in rows]

        self._cached_lines = res
        return res

    # ------------------ BAG SETTINGS ------------------
    def get_line_starting_bags(self) -> Dict[str, float]:
        default_bags = {
            "morning": 1000000.0,
            "evening_1": 1000000.0,
            "evening_2": 1000000.0,
        }
        if self.use_postgres:
            try:
                from psycopg2.extras import RealDictCursor
                with self._get_pg_connection() as conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute("SELECT line_id, starting_bag FROM public.line_bag_settings")
                        for r in cur.fetchall():
                            default_bags[r["line_id"]] = float(r["starting_bag"])
                        return default_bags
            except Exception as e:
                print(f"[Supabase PG error in get_line_starting_bags]: {e}")

        with self._get_sqlite_connection() as conn:
            rows = conn.execute("SELECT line_id, starting_bag FROM line_bag_settings").fetchall()
            for r in rows:
                default_bags[r["line_id"]] = float(r["starting_bag"])
        return default_bags

    def get_bag_settings(self) -> Dict[str, Any]:
        line_bags = self.get_line_starting_bags()
        total_starting = sum(line_bags.values())

        if self.use_postgres:
            try:
                from psycopg2.extras import RealDictCursor
                with self._get_pg_connection() as conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute("SELECT id, starting_bag, currency, notes FROM public.bag_settings WHERE id = 1")
                        row = cur.fetchone()
                        if row:
                            d = dict(row)
                            d["line_starting_bags"] = line_bags
                            d["starting_bag"] = total_starting
                            return d
            except Exception as e:
                print(f"[Supabase PG error in get_bag_settings]: {e}")

        with self._get_sqlite_connection() as conn:
            row = conn.execute("SELECT * FROM bag_settings WHERE id = 1").fetchone()
            if row:
                d = dict(row)
                d["line_starting_bags"] = line_bags
                d["starting_bag"] = total_starting
                return d
            return {
                "id": 1,
                "starting_bag": total_starting,
                "line_starting_bags": line_bags,
                "currency": "INR",
                "notes": "Ashok Finance Bag Capital"
            }

    def update_bag_settings(
        self, 
        starting_bag: Optional[float] = None, 
        notes: Optional[str] = None,
        line_id: Optional[str] = None,
        line_starting_bags: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        now_str = datetime.utcnow().isoformat()
        current_bags = self.get_line_starting_bags()

        if line_starting_bags:
            for lid, amt in line_starting_bags.items():
                if lid in current_bags:
                    current_bags[lid] = float(amt)
        elif line_id and line_id != "all":
            if starting_bag is not None:
                current_bags[line_id] = float(starting_bag)
        elif starting_bag is not None:
            per_line = round(float(starting_bag) / 3.0, 2)
            for lid in current_bags:
                current_bags[lid] = per_line

        total_starting = sum(current_bags.values())

        # 1. Update in Supabase PostgreSQL
        if self.use_postgres:
            try:
                with self._get_pg_connection() as conn:
                    with conn.cursor() as cur:
                        for lid, amt in current_bags.items():
                            cur.execute("""
                                INSERT INTO public.line_bag_settings (line_id, starting_bag, notes, updated_at)
                                VALUES (%s, %s, %s, NOW())
                                ON CONFLICT(line_id) DO UPDATE SET starting_bag = EXCLUDED.starting_bag, notes = EXCLUDED.notes, updated_at = NOW()
                            """, (lid, amt, notes or f"{lid} updated"))

                        cur.execute("""
                            INSERT INTO public.bag_settings (id, starting_bag, currency, notes, updated_at)
                            VALUES (1, %s, 'INR', COALESCE(%s, 'Ashok Finance Combined Bag'), NOW())
                            ON CONFLICT(id) DO UPDATE SET starting_bag = EXCLUDED.starting_bag, notes = COALESCE(EXCLUDED.notes, public.bag_settings.notes), updated_at = NOW()
                        """, (total_starting, notes))
                    conn.commit()
            except Exception as e:
                print(f"[Supabase PG error in update_bag_settings]: {e}")

        # 2. Update local SQLite backup
        with self._get_sqlite_connection() as conn:
            for lid, amt in current_bags.items():
                conn.execute("""
                    INSERT INTO line_bag_settings (line_id, starting_bag, notes, updated_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(line_id) DO UPDATE SET starting_bag = excluded.starting_bag, notes = excluded.notes, updated_at = excluded.updated_at
                """, (lid, amt, notes or f"{lid} updated", now_str))

            conn.execute("""
                UPDATE bag_settings 
                SET starting_bag = ?, notes = COALESCE(?, notes), updated_at = ?
                WHERE id = 1
            """, (total_starting, notes, now_str))
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

        if self.use_postgres:
            try:
                from psycopg2.extras import RealDictCursor
                with self._get_pg_connection() as conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        query = "SELECT id, entry_date, line_id, income, outgoing, net_amount, notes, created_at, updated_at FROM public.daily_entries WHERE 1=1"
                        params = []
                        if start_date:
                            query += " AND entry_date >= %s"
                            params.append(start_date.isoformat() if isinstance(start_date, date) else str(start_date))
                        if end_date:
                            query += " AND entry_date <= %s"
                            params.append(end_date.isoformat() if isinstance(end_date, date) else str(end_date))
                        if line_id and line_id != "all":
                            query += " AND line_id = %s"
                            params.append(line_id)
                        query += " ORDER BY entry_date DESC, created_at DESC"

                        cur.execute(query, params)
                        rows = cur.fetchall()
                        entries = []
                        for r in rows:
                            d = dict(r)
                            d["id"] = str(d["id"])
                            d["entry_date"] = str(d["entry_date"])
                            d["income"] = float(d.get("income") or 0.0)
                            d["outgoing"] = float(d.get("outgoing") or 0.0)
                            d["net_amount"] = float(d.get("net_amount") or (d["income"] - d["outgoing"]))
                            d["line_name"] = line_lookup.get(d["line_id"], d["line_id"])
                            d["created_at"] = str(d.get("created_at") or "")
                            d["updated_at"] = str(d.get("updated_at") or "")
                            entries.append(d)
                        return entries
            except Exception as e:
                print(f"[Supabase PG error in get_entries]: {e}")

        with self._get_sqlite_connection() as conn:
            query = "SELECT * FROM daily_entries WHERE 1=1"
            params = []
            if start_date:
                query += " AND entry_date >= ?"
                params.append(start_date.isoformat() if isinstance(start_date, date) else str(start_date))
            if end_date:
                query += " AND entry_date <= ?"
                params.append(end_date.isoformat() if isinstance(end_date, date) else str(end_date))
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
        line_lookup = {l["id"]: l["name"] for l in self.get_lines()}

        # 1. Insert in Supabase PostgreSQL
        if self.use_postgres:
            try:
                with self._get_pg_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute("""
                            INSERT INTO public.daily_entries (id, entry_date, line_id, income, outgoing, net_amount, notes, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """, (entry_id, date_str, line_id, float(income), float(outgoing), net_amount, notes))
                    conn.commit()
            except Exception as e:
                print(f"[Supabase PG error in create_entry]: {e}")

        # 2. Sync to local SQLite backup
        with self._get_sqlite_connection() as conn:
            conn.execute("""
                INSERT INTO daily_entries (id, entry_date, line_id, income, outgoing, net_amount, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (entry_id, date_str, line_id, float(income), float(outgoing), net_amount, notes, now_str, now_str))
            conn.commit()

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

        entries = self.get_entries()
        existing = next((e for e in entries if e["id"] == entry_id), None)

        if not existing:
            return None

        income = kwargs.get("income")
        if income is None:
            income = float(existing.get("income", 0.0))
        else:
            income = float(income)

        outgoing = kwargs.get("outgoing")
        if outgoing is None:
            outgoing = float(existing.get("outgoing", 0.0))
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

        # 1. Update in Supabase PostgreSQL
        if self.use_postgres:
            try:
                with self._get_pg_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE public.daily_entries
                            SET entry_date = %s, line_id = %s, income = %s, outgoing = %s, net_amount = %s, notes = %s, updated_at = NOW()
                            WHERE id = %s
                        """, (entry_date, line_id, income, outgoing, net_amount, notes, entry_id))
                    conn.commit()
            except Exception as e:
                print(f"[Supabase PG error in update_entry]: {e}")

        # 2. Update local SQLite
        with self._get_sqlite_connection() as conn:
            conn.execute("""
                UPDATE daily_entries
                SET entry_date = ?, line_id = ?, income = ?, outgoing = ?, net_amount = ?, notes = ?, updated_at = ?
                WHERE id = ?
            """, (entry_date, line_id, income, outgoing, net_amount, notes, now_str, entry_id))
            conn.commit()

        line_lookup = {l["id"]: l["name"] for l in self.get_lines()}
        return {
            "id": entry_id,
            "entry_date": entry_date,
            "line_id": line_id,
            "line_name": line_lookup.get(line_id, line_id),
            "income": income,
            "outgoing": outgoing,
            "net_amount": net_amount,
            "notes": notes,
            "updated_at": now_str,
        }

    def delete_entry(self, entry_id: str) -> bool:
        deleted = False
        if self.use_postgres:
            try:
                with self._get_pg_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute("DELETE FROM public.daily_entries WHERE id = %s", (entry_id,))
                        deleted = cur.rowcount > 0
                    conn.commit()
            except Exception as e:
                print(f"[Supabase PG error in delete_entry]: {e}")

        with self._get_sqlite_connection() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM daily_entries WHERE id = ?", (entry_id,))
            conn.commit()
            if cur.rowcount > 0:
                deleted = True

        return deleted

    # ------------------ STATUS CALCULATIONS ------------------
    def get_bag_status(
        self, 
        all_entries: Optional[List[Dict[str, Any]]] = None,
        line_bags: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        if line_bags is None:
            line_bags = self.get_line_starting_bags()
        total_starting_bag = sum(line_bags.values())

        if all_entries is None:
            all_entries = self.get_entries()

        total_income = 0.0
        total_outgoing = 0.0
        today_income = 0.0
        today_outgoing = 0.0
        today_str = date.today().isoformat()

        month_income = 0.0
        month_outgoing = 0.0
        month_prefix = date.today().strftime("%Y-%m")

        lines = self.get_lines()
        lines_summary = {
            l["id"]: {
                "line_id": l["id"],
                "line_name": l["name"],
                "starting_bag": float(line_bags.get(l["id"], 1000000.0)),
                "current_bag": float(line_bags.get(l["id"], 1000000.0)),
                "total_income": 0.0,
                "total_outgoing": 0.0,
                "net_amount": 0.0,
                "today_income": 0.0,
                "today_outgoing": 0.0,
                "today_net": 0.0,
                "month_income": 0.0,
                "month_outgoing": 0.0,
                "month_net": 0.0,
                "growth_amount": 0.0,
                "growth_percent": 0.0,
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
            is_today = (e_date == today_str)
            is_month = e_date.startswith(month_prefix)

            if is_today:
                today_income += inc
                today_outgoing += out

            if is_month:
                month_income += inc
                month_outgoing += out

            lid = e.get("line_id")
            if lid in lines_summary:
                lines_summary[lid]["total_income"] += inc
                lines_summary[lid]["total_outgoing"] += out
                lines_summary[lid]["net_amount"] += (inc - out)
                lines_summary[lid]["entries_count"] += 1
                if is_today:
                    lines_summary[lid]["today_income"] += inc
                    lines_summary[lid]["today_outgoing"] += out
                    lines_summary[lid]["today_net"] += (inc - out)
                if is_month:
                    lines_summary[lid]["month_income"] += inc
                    lines_summary[lid]["month_outgoing"] += out
                    lines_summary[lid]["month_net"] += (inc - out)

        for lid, summary in lines_summary.items():
            start = summary["starting_bag"]
            net = round(summary["net_amount"], 2)
            cur = round(start + net, 2)
            summary["current_bag"] = cur
            summary["growth_amount"] = round(cur - start, 2)
            summary["growth_percent"] = round((summary["growth_amount"] / start * 100), 2) if start > 0 else 0.0
            summary["total_income"] = round(summary["total_income"], 2)
            summary["total_outgoing"] = round(summary["total_outgoing"], 2)
            summary["today_income"] = round(summary["today_income"], 2)
            summary["today_outgoing"] = round(summary["today_outgoing"], 2)
            summary["today_net"] = round(summary["today_net"], 2)
            summary["month_income"] = round(summary["month_income"], 2)
            summary["month_outgoing"] = round(summary["month_outgoing"], 2)
            summary["month_net"] = round(summary["month_net"], 2)

        total_net = round(total_income - total_outgoing, 2)
        total_current_bag = round(total_starting_bag + total_net, 2)
        today_net = round(today_income - today_outgoing, 2)
        month_net = round(month_income - month_outgoing, 2)
        growth_amount = round(total_current_bag - total_starting_bag, 2)
        growth_percent = round((growth_amount / total_starting_bag * 100), 2) if total_starting_bag > 0 else 0.0

        return {
            "starting_bag": round(total_starting_bag, 2),
            "current_bag": total_current_bag,
            "total_income": round(total_income, 2),
            "total_outgoing": round(total_outgoing, 2),
            "total_net": total_net,
            "today_income": round(today_income, 2),
            "today_outgoing": round(today_outgoing, 2),
            "today_net": today_net,
            "month_income": round(month_income, 2),
            "month_outgoing": round(month_outgoing, 2),
            "month_net": month_net,
            "growth_amount": growth_amount,
            "growth_percent": growth_percent,
            "lines_summary": list(lines_summary.values()),
            "line_starting_bags": line_bags,
            "total_entries": len(all_entries),
            "database_source": "supabase" if self.use_postgres else "sqlite",
            "as_of": datetime.utcnow().isoformat(),
        }

db = DatabaseManager()
