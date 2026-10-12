# ASHOK FINANCE - DAILY LINE LEDGER & BAG CAPITAL SYSTEM

A modern, high-performance financial management web application built for **Ashok Finance**. Features a clean white and ruby-red financial theme, responsive mobile and desktop views, real-time Bag capital tracking across 3 distinct business lines, live edit & delete capabilities, Supabase cloud synchronization, and professional PDF financial statement export.

---

## 🏛️ Business Lines
The application manages 3 independent lines with combined overview capabilities:
1. **ASHOK FINANCE MORNING**
2. **ASHOK FINANCE EVENING 1**
3. **ASHOK FINANCE EVENING 2**

---

## 💰 Core Financial & Bag Logic
- **Starting Bag Baseline**: Default **₹10,00,000** (10 Lakhs). Customizable and editable at any time.
- **Daily Cashflow**:
  $$\text{Net Flow} = \text{Income} - \text{Outgoing}$$
- **Dynamic Bag Balance**:
  - If $\text{Income} - \text{Outgoing} > 0$ (Positive Cashflow): **Adds directly to the Bag balance**.
  - If $\text{Income} - \text{Outgoing} < 0$ (Negative Cashflow): **Subtracts directly from the Bag balance**.
  - Current Bag reflects real-time status:
    $$\text{Current Bag} = \text{Initial Bag} + \sum (\text{Income} - \text{Outgoing})$$

---

## ⚡ Tech Stack & Architecture
- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 + Lucide Icons + jsPDF / autoTable.
  - Zero-login experience: Starts directly on the interactive Welcome Dashboard.
  - White & Crimson-red financial design with clean Indian currency formatting (`₹`).
  - Mobile-first responsive UI (touch tabs, mobile cards, FAB quick entry button).
  - 0ms client-side PDF statement export + backend PDF streaming.
  - Ready for **Vercel** deployment with `vercel.json`.
- **Backend**: Python 3.12 + FastAPI + Uvicorn + Pydantic v2 + ReportLab.
  - RESTful APIs for lines, daily entries, bag settings, and server-side PDF generator.
  - SQLite auto-fallback + Supabase PostgreSQL driver.
  - Ready for **Render** deployment with `render.yaml` and `Procfile`.
- **Database**: **Supabase** (PostgreSQL with Row Level Security and Realtime enabled).

---

## 🚀 Quick Start Guide (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 2. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Copy .env.example to .env and configure Supabase
# If left unconfigured, the backend automatically runs SQLite locally
copy .env.example .env

# Run the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API documentation is available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🗄️ Supabase Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Open the **SQL Editor** in the left sidebar.
3. Open `backend/supabase_schema.sql` (or copy it directly from the app's **Database** dialog in the top header).
4. Paste the SQL script and click **Run**.
5. Go to **Project Settings -> API** in Supabase:
   - Copy the **Project URL**
   - Copy the **anon / public** API Key
6. In the Ashok Finance web app, click the **Database** button in the header, paste your Supabase URL & Key, and click **Save & Connect**!

---

## ☁️ Deployment Guide

### Deploying the Backend to Render
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `SUPABASE_URL`: (Your Supabase Project URL)
   - `SUPABASE_KEY`: (Your Supabase Anon / Service Key)
6. Click **Deploy Web Service**. Render will assign a public URL (e.g. `https://ashok-finance-api.onrender.com`).

### Deploying the Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) -> **Add New Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: (Your Supabase Project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
   - `VITE_API_URL`: (Your Render Backend URL, e.g. `https://ashok-finance-api.onrender.com`)
5. Click **Deploy**. Vercel will build and launch your application globally!

---

## 📄 PDF Financial Statement Features
Clicking **PDF Report** generates an executive financial statement containing:
- Ashok Finance Letterhead & generation timestamp.
- Line breakdown (Morning, Evening 1, Evening 2).
- Executive Capital Bag Summary (Initial Bag ₹10,00,000, Total Income, Total Outgoing, Net Cashflow, Current Bag Balance).
- Tabular Daily Ledger Entries with color-coded Net amounts.
- Authorized Signatory and Verification block.
