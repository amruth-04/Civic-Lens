from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="Civic Lens API")

# This allows your React frontend to talk to this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In a real app, we restrict this. For now, allow all.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 🚨 CHANGE THE PASSWORD BELOW TO YOUR PGADMIN PASSWORD 🚨 ---
def get_db_connection():
    return psycopg2.connect(
        host="localhost", 
        database="civic_lens", 
        user="postgres", 
        password="Amruth04@post" 
    )

# This tells the API what data to expect from the user
class TaxRequest(BaseModel):
    income: float
    tax_paid: Optional[float] = None
    regime: str = "new"

# The math logic for the new tax regime
def calculate_new_regime_tax(income: float) -> float:
    if income <= 1200000:
        return 0
    
    tax = 0
    remaining = income - 75000 # Standard deduction
    slabs = [
        (400000, 0), (800000, 0.05), (1200000, 0.10), 
        (1600000, 0.15), (2000000, 0.20), (2400000, 0.25), (float('inf'), 0.30)
    ]
    
    prev_limit = 0
    for limit, rate in slabs:
        if remaining <= 0: break
        taxable_in_slab = min(remaining, limit - prev_limit)
        tax += taxable_in_slab * rate
        remaining -= taxable_in_slab
        prev_limit = limit
        
    cess = tax * 0.04
    return round(tax + cess)

# The actual endpoint the frontend will call
@app.post("/api/v1/tax-breakdown")
def get_tax_breakdown(req: TaxRequest):
    tax_paid = req.tax_paid
    
    # 1. Calculate Tax if the user didn't manually enter it
    if not tax_paid or tax_paid <= 0:
        if req.income <= 0:
            raise HTTPException(status_code=400, detail="Must provide either income or tax paid.")
        
        if req.regime == "new":
            tax_paid = calculate_new_regime_tax(req.income)
        else:
            tax_paid = round(calculate_new_regime_tax(req.income) * 1.15) # Simple estimate

    if tax_paid <= 0:
        return {"total_tax": 0, "breakdown": []}

    # 2. Fetch Budget Allocations from your PostgreSQL Database
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("SELECT sector_name, allocation_percentage, color_code, description FROM dim_category")
        categories = cursor.fetchall()
        
        # 3. Calculate individual amounts based on percentages
        breakdown = []
        for cat in categories:
            amount = round(tax_paid * (float(cat['allocation_percentage']) / 100))
            breakdown.append({
                "name": cat['sector_name'],
                "percent": float(cat['allocation_percentage']),
                "amount": amount,
                "color": cat['color_code'],
                "desc": cat['description']
            })
            
        # Sort so the biggest expenses are at the top
        breakdown.sort(key=lambda x: x['percent'], reverse=True)
        
        return {
            "total_tax": tax_paid,
            "breakdown": breakdown
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()