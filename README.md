# Civic Lens 🔍

Civic Lens is a full-stack web application designed to help citizens visualize exactly where their tax money goes. By inputting their annual income, users receive a dynamic, interactive breakdown of how their contribution is allocated across various government sectors.

## 🚀 Features
* **Interactive Visualization:** Dynamic donut charts and progress bars for easy data consumption.
* **Custom Tax Calculation:** Supports both Old and New tax regimes.
* **Real-time Processing:** Fast API responses for immediate UI updates.

## 💻 Tech Stack
* **Frontend:** React, Vite, HTML/CSS
* **Backend:** Python, FastAPI, Uvicorn
* **Database:** PostgreSQL (pgAdmin)

## 🛠️ How to Run Locally

### 1. Database Setup
* Ensure PostgreSQL is installed and running.
* Create a database named `civic_lens`.
* Run the SQL injection script to populate the `dim_category` table.

### 2. Start the Backend (FastAPI)
```bash
# Activate virtual environment
venv\Scripts\activate

# Start the server
uvicorn main:app --reload
```

### 3. Start the Frontend (React)
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies and start server
npm install
npm run dev
```
