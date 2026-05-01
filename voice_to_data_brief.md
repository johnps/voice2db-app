# Client Brief: Voice-to-Structured Data Capture System

## 1. Overview

We want to build a mobile-first system that allows field workers to speak observations naturally and have those observations automatically:

1. Converted from speech to text  
2. Interpreted into structured data  
3. Stored as updates to an existing database record  

The goal is to replace cumbersome touch-based form filling with a voice-first workflow.

## 2. Problem Statement

Current systems rely on structured forms and touch input, which are:
- Time-consuming
- Cognitively heavy
- Unnatural
- Error-prone

We need:
“Say what you observe” → system structures it automatically

## 3. Example Input

"Meena didi has 2 goats right now, 1 of them is pregnant and she sold one last month. She has planted seeds for tomato cultivation and watered them once. She has not yet given fertilizer."

## 4. Expected Output

{
  "beneficiary_name": "Meena didi",
  "livestock": {
    "goats_total": 2,
    "goats_pregnant": 1,
    "goats_sold_last_3_months": 1
  },
  "tomato_cultivation": {
    "seed_planted": true,
    "watering_1": true,
    "fertilizer_1": false
  }
}

## 5. Core Requirements

- Voice capture (10–60 sec)
- Speech-to-text
- Structured extraction (LLM)
- Entity selection before recording
- Confirmation before save
- Partial updates only

## 6. Flow

1. Select beneficiary
2. Record voice
3. Convert to text
4. Extract structured data
5. Show summary
6. Confirm
7. Update DB

## 7. Success Metrics

- <30 sec per entry
- ≥80% extraction accuracy
- ≥50% reduction in form time

## 8. Principle

Always show extracted data before saving.
Never silently update records.
