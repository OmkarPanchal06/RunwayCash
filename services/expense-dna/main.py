from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from analyzer import detect_recurring_patterns, normalize_merchant

app = FastAPI(title="RunwayCash Expense DNA Service")

class TransactionInput(BaseModel):
    id: str
    amount_cents: int
    date: str
    raw_merchant: str

class BatchAnalyzeRequest(BaseModel):
    transactions: List[TransactionInput]

@app.post("/api/v1/analyze/recurring")
async def analyze_recurring(request: BatchAnalyzeRequest):
    txs = [tx.model_dump() for tx in request.transactions]
    patterns = detect_recurring_patterns(txs)
    return {"patterns": patterns}

@app.post("/api/v1/analyze/normalize")
async def normalize_merchants(request: BatchAnalyzeRequest):
    results = []
    for tx in request.transactions:
        results.append({
            "id": tx.id,
            "normalized_merchant": normalize_merchant(tx.raw_merchant)
        })
    return {"normalized": results}

@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "expense-dna"}
