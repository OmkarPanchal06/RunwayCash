import pandas as pd
import numpy as np
import re

def normalize_merchant(raw_string: str) -> str:
    """Removes POS IDs, dates, and locations from raw bank strings."""
    # Remove dates like 10/12 or 2023-01
    s = re.sub(r'\d{2,4}[-/]\d{2,4}', '', raw_string)
    # Remove common POS prefixes/suffixes
    s = re.sub(r'(?i)(TST\*|SQ \*|PAYPAL \*|AMZN Mktp US\*?|UBER\s+\*?)', '', s)
    # Remove random trailing alphanumeric IDs
    s = re.sub(r'[A-Z0-9]{5,}$', '', s)
    # Remove special chars and clean up whitespace
    s = re.sub(r'[^a-zA-Z0-9\s]', '', s)
    return ' '.join(s.split()).upper().strip()

def detect_recurring_patterns(transactions: list[dict]) -> list[dict]:
    """
    Takes a list of dicts: {'amount_cents': int, 'date': 'YYYY-MM-DD', 'raw_merchant': str}
    Returns detected recurring patterns.
    """
    if not transactions:
        return []
    
    df = pd.DataFrame(transactions)
    df['date'] = pd.to_datetime(df['date'])
    df['normalized_merchant'] = df['raw_merchant'].apply(normalize_merchant)
    
    patterns = []
    
    # Group by normalized merchant
    grouped = df.groupby('normalized_merchant')
    
    for merchant, group in grouped:
        if len(group) < 2:
            continue
            
        # Sort by date
        group = group.sort_values('date')
        
        # Calculate days between transactions
        group['days_diff'] = group['date'].diff().dt.days
        
        # Exclude the first NaN row
        diffs = group['days_diff'].dropna()
        if len(diffs) == 0:
            continue
            
        avg_diff = diffs.mean()
        std_diff = diffs.std()
        
        # Very simple heuristic for MVP
        frequency = None
        confidence = 0.0
        
        if 25 <= avg_diff <= 35:
            frequency = 'monthly'
            confidence = 1.0 if pd.isna(std_diff) or std_diff < 3 else 0.7
        elif 6 <= avg_diff <= 8:
            frequency = 'weekly'
            confidence = 1.0 if pd.isna(std_diff) or std_diff < 1.5 else 0.7
        elif 12 <= avg_diff <= 16:
            frequency = 'biweekly'
            confidence = 0.9 if pd.isna(std_diff) or std_diff < 2 else 0.6
            
        if frequency:
            last_date = group['date'].iloc[-1]
            next_due = last_date + pd.Timedelta(days=round(avg_diff))
            
            # Use mean amount (or exact if it's fixed)
            amount = int(group['amount_cents'].mean())
            
            patterns.append({
                'merchant': merchant,
                'amount_cents': amount,
                'frequency': frequency,
                'next_expected_date': next_due.strftime('%Y-%m-%d'),
                'confidence_score': round(confidence, 2)
            })
            
    return patterns
