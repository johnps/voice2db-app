# PRD: Voice-to-Structured Data Capture System

## Problem Statement

Field workers monitoring agricultural beneficiaries (smallholder farmers in rural India) currently record observations using structured touch-based forms on mobile devices. This workflow is time-consuming, cognitively demanding, and unnatural in field conditions — workers must navigate multiple screens and tap through form fields while standing in a beneficiary's home or farm. The process is error-prone and slow, reducing the number of beneficiaries a worker can visit per day. Connectivity is poor or absent in most operating areas, making cloud-dependent tools unreliable.

## Solution

A mobile-first voice capture system that lets field workers speak their observations naturally and have them automatically transcribed, interpreted into structured data, and used to update beneficiary records — with full offline capability. The worker selects a beneficiary, records a 10–60 second voice note, reviews the extracted data on an editable confirmation screen, and confirms. The system handles transcription on-device and queues LLM extraction for when connectivity returns. Nothing is written to the database without explicit worker confirmation.

## User Stories

### Authentication
1. As a field worker, I want to log in with my phone number and a one-time SMS code, so that I don't need to remember a password in the field.
2. As a field worker, I want my session to persist across app restarts, so that I don't need to log in every day.
3. As a field worker, I want to be automatically logged out if my session expires, so that my account stays secure if I lose my phone.

### Beneficiary Selection
4. As a field worker, I want to see only the beneficiaries assigned to me, so that I don't accidentally update the wrong person's record.
5. As a field worker, I want to search my beneficiary list by name or village, so that I can quickly find the right person in the field.
6. As a field worker, I want to see a beneficiary's livelihood profile at a glance (active tracks, current PoP step, goat count, recent income), so that I arrive at the visit with context.
7. As a field worker, I want to see which livelihoods a beneficiary is actively participating in, so that I know what to ask about during the visit.

### Voice Recording
8. As a field worker, I want to tap a single button to start and stop recording, so that the interaction is simple while I'm standing in a field.
9. As a field worker, I want to record observations between 10 and 60 seconds, so that I can cover multiple topics in a single note without being cut off.
10. As a field worker, I want to see a live audio waveform while recording, so that I know the microphone is capturing my voice.
11. As a field worker, I want my recording saved to my device immediately, so that I don't lose it if the app crashes or connectivity drops.

### Transcription
12. As a field worker, I want my voice note transcribed on my device without needing internet, so that the workflow is never blocked by poor connectivity.
13. As a field worker, I want to see the raw transcript immediately after recording, so that I can spot and correct obvious mishears before the data is extracted.
14. As a field worker, I want to edit the transcript text directly, so that I can fix errors without re-recording the entire note.

### LLM Extraction
15. As a field worker, I want the app to automatically extract structured data from my transcript, so that I don't have to manually fill in fields.
16. As a field worker, I want extraction to run in the background when connectivity returns if I was offline, so that I'm never blocked from continuing work.
17. As a field worker, I want to see a badge showing how many recordings are pending extraction, so that I know what still needs to be confirmed.

### Confirmation Screen
18. As a field worker, I want to see all extracted data before it is saved, so that I can catch errors before they enter the record.
19. As a field worker, I want each extracted field displayed with an appropriate input control (number stepper, toggle, dropdown), so that corrections are quick and intuitive.
20. As a field worker, I want to edit any extracted value directly on the confirmation screen, so that a wrong extraction doesn't require a full re-record.
21. As a field worker, I want to confirm all extracted fields in one tap, so that the final save is fast.
22. As a field worker, I want to discard an extraction entirely if it is too inaccurate, so that bad data never enters the record.

### Income & Expense Logging
23. As a field worker, I want to log weekly income for a beneficiary tagged by livelihood source (agriculture, livestock, enterprise, other), so that program impact can be tracked per activity.
24. As a field worker, I want to log weekly expenses tagged by source, so that net income can be calculated accurately.
25. As a program manager, I want to see a beneficiary's net income for the past month, past 3 months, and past year, so that I can assess economic trajectory.

### Savings Logging
26. As a field worker, I want to log savings deposits and withdrawals for a beneficiary, so that savings behaviour is tracked over time.
27. As a program manager, I want to see a beneficiary's current savings balance, so that I can assess financial resilience.

### Goat Inventory
28. As a field worker, I want to log goat purchases, sales, births, and deaths as individual events, so that the herd inventory stays accurate.
29. As a program manager, I want to see the current total goat count derived from the event ledger, so that I have an accurate livestock snapshot.
30. As a program manager, I want to see the current livestock asset value calculated as goat count × assigned value per head, so that productive asset growth is tracked.

### Package of Practice Progress
31. As a field worker, I want to log which PoP step a beneficiary has reached for vegetable cultivation, goat rearing, or nano-enterprise, so that adoption progress is captured.
32. As a field worker, I want the app to record the timestamp when each step was reached, so that the pace of progression can be analysed.
33. As a program manager, I want to see the current PoP step per livelihood track, so that I know where each beneficiary is in the programme.
34. As a program manager, I want to see the full step progression history with dates, so that I can identify stalls or regressions.

### Offline Behaviour
35. As a field worker, I want to record voice notes even when I have no connectivity, so that my work is never blocked by poor signal.
36. As a field worker, I want queued recordings to be processed automatically in the background when connectivity returns, so that I don't have to manually trigger anything.
37. As a field worker, I want all unconfirmed extractions to be available in a pending confirmations list, so that I can batch-confirm at the end of the day.
38. As a field worker, I want data I have confirmed to sync to the server automatically when connectivity returns, so that the central record stays up to date.

### Audit & History
39. As a program manager, I want every confirmed update to be stored as an append-only log entry with worker ID, timestamp, transcript, and JSON diff, so that there is a full audit trail.
40. As a program manager, I want to be able to replay what a worker said for any historical update, so that disputed records can be verified.

---

## Implementation Decisions

### Stack
- React Native + Expo (iOS + Android)
- Supabase: Postgres, Auth, Storage, Edge Functions
- Whisper tiny via `whisper.rn` (on-device STT, bundled at install)
- Claude API — `claude-haiku-4-5` default, promote to `claude-sonnet-4-6` if extraction accuracy falls below 80%

### Modules

**AuthModule**
Wraps Supabase phone OTP auth. Exposes `signIn(phone)`, `verifyOTP(code)`, `getSession()`, `signOut()`. Persists session across restarts using secure device storage.

**BeneficiaryModule**
Fetches assigned beneficiaries filtered by `worker_beneficiary` join. Exposes `getAssigned(workerId)`, `getProfile(id)`, `getCurrentState(id)`. `getCurrentState` derives: active livelihoods, current PoP step per track, goat count, PAV, income summaries, savings balance.

**AudioRecorderModule**
Wraps Expo AV. Exposes `start()`, `stop(): AudioFile`. Stores audio locally on stop. Exposes `upload(file): url` to push to Supabase Storage when connected.

**STTModule**
Wraps `whisper.rn` with the bundled tiny model. Exposes `transcribe(audioPath): Promise<string>`. Stateless — caller manages audio file lifecycle.

**LLMExtractionModule**
Constructs a Claude API prompt from the corrected transcript and the fixed extraction schema. Returns a typed `ExtractionResult` (partial — only fields mentioned in the recording). Handles API errors and retries. Exposes `extract(transcript, schema): Promise<ExtractionResult>`.

**OfflineQueueModule**
Persists extraction jobs to local storage (MMKV or SQLite). Monitors connectivity via NetInfo. Drains queue in background when connected. Exposes `enqueue(job)`, `processQueue()`, `pendingCount(): number`.

**BeneficiaryUpdateModule**
Writes a confirmed extraction to all relevant domain tables in a single Supabase transaction: `income_entries`, `savings_entries`, `goat_events`, `pop_progress`, and `beneficiary_updates` (audit log). Exposes `applyUpdate(beneficiaryId, workerId, result, transcript, audioUrl)`.

**CalculatedStateModule**
Pure functions with no side effects. Computes goat count, PAV, net income by period, savings balance, active livelihoods, and PoP current step from raw domain table rows. No direct DB access — receives data from BeneficiaryModule.

### Database Schema

**`beneficiaries`** — profile and baselines
- `id`, `name`, `village_name`, `age`, `family_size`, `phone_number`, `shg_name`
- `baseline_income`, `baseline_savings`, `baseline_non_livestock_assets`
- `goat_value_per_head` — assumed INR value per goat, set at enrollment

**`income_entries`** — income/expense ledger
- `beneficiary_id`, `worker_id`, `entry_date`
- `livelihood_source`: enum (agriculture / livestock / enterprise / other)
- `type`: enum (income / expense), `amount`, `notes`

**`savings_entries`** — savings ledger
- `beneficiary_id`, `worker_id`, `entry_date`
- `type`: enum (deposit / withdrawal), `amount`

**`goat_events`** — livestock inventory
- `beneficiary_id`, `worker_id`, `event_date`
- `event_type`: enum (purchase / sale / birth / death), `count`, `notes`

**`pop_progress`** — package of practice completions
- `beneficiary_id`, `worker_id`, `completed_at`
- `livelihood_track`: enum (vegetable_cultivation / goat_rearing / nano_enterprise)
- `step_number`: integer 1–5

**`beneficiary_updates`** — append-only audit log
- `beneficiary_id`, `worker_id`, `created_at`
- `transcript`, `audio_url`, `json_diff` (JSONB)

**`workers`** — linked to Supabase Auth

**`worker_beneficiary`** — assignment join table

### Package of Practice Steps

**Vegetable Cultivation:** (1) Land preparation, (2) Seed/seedling procurement and sowing, (3) Irrigation setup and first watering, (4) Fertilizer and pest management, (5) Harvest and market linkage.

**Goat Rearing:** (1) Shelter construction or improvement, (2) Procurement of quality breed, (3) Vaccination and deworming, (4) Improved fodder and feed management, (5) Breeding management and sale planning.

**Non-Farm Nano-Enterprise:** (1) Business identification and market assessment, (2) Capital mobilisation, (3) Shop setup and initial stock procurement, (4) Daily sales and basic record keeping, (5) Business expansion or second product line.

### LLM Extraction Schema
The Claude API receives the corrected transcript and a target JSON schema. It returns only the fields mentioned in the recording:
- `income_entries[]`: source, type, amount
- `savings_entries[]`: type, amount
- `goat_events[]`: event_type, count
- `pop_progress[]`: livelihood_track, step_number

### Offline Strategy
- STT runs on-device immediately after recording (no network needed)
- LLM extraction is enqueued if offline; OfflineQueueModule drains automatically on reconnect
- DB writes are queued if offline; synced on reconnect
- Audio is stored locally until upload succeeds; then deleted from device
- Audio retained in Supabase Storage for 30 days, then deleted by a scheduled Edge Function

### Auth
- Supabase phone OTP (SMS)
- Workers see only assigned beneficiaries (RLS on `worker_beneficiary`)
- Admin manages workers and assignments via Supabase dashboard

---

## Testing Decisions

A good test verifies observable external behaviour, not internal implementation. Tests should assert what comes out given what goes in — not how the module achieves it internally.

**CalculatedStateModule** — Full unit test coverage. Pure functions with known inputs and outputs. Test: goat count from a sequence of events, PAV calculation, net income across date windows, savings balance, PoP current step from out-of-order completions, active livelihood derivation.

**LLMExtractionModule** — Unit tests with mocked Claude API responses. Test: well-formed transcript returns correct JSON diff, partial mention extracts only relevant fields, ambiguous input is handled gracefully, API error triggers retry.

**BeneficiaryUpdateModule** — Integration tests against a real Supabase test instance. Test: a confirmed extraction writes correctly to all domain tables atomically, a failed write rolls back entirely, duplicate confirmation is idempotent.

**OfflineQueueModule** — Unit tests with mocked connectivity and mocked LLMExtractionModule. Test: job enqueued when offline, queue drains when connectivity returns, failed job is re-enqueued with backoff, `pendingCount()` reflects queue state accurately.

**STTModule** — Smoke test only (requires device). Verify it returns a non-empty string for a known audio fixture.

---

## Out of Scope

- Dynamic schema per beneficiary type (fixed schema only for pilot)
- Hindi and regional Indian language support (English only for pilot)
- Custom admin UI for worker and beneficiary management (Supabase dashboard only)
- Per-vehicle savings tracking (SHG / bank / cash — total balance only)
- Differentiated goat valuation by gender/age (single value per head)
- Push notifications for pending confirmations
- Multi-tenancy / multiple organisations
- Beneficiary-facing interface

---

## Further Notes

- Target devices: Android 2018+ (Snapdragon 6xx, 2–3GB RAM). Whisper tiny (~75MB) chosen specifically for this hardware floor. Step up to Whisper small if accuracy is the bottleneck after pilot.
- Success metrics: <30 sec per entry end-to-end, ≥80% extraction accuracy, ≥50% reduction in data entry time vs. form-based workflow.
- The 80% extraction accuracy target should be measured during the pilot by comparing confirmed values against raw extractions (edit rate on confirmation screen is a proxy metric).
- `goat_value_per_head` is set at beneficiary enrollment. Differentiation by sex/age (male, female, kid) is a planned future extension.
- Productive asset value = `baseline_non_livestock_assets` + (current goat count × `goat_value_per_head`). Baseline is split to avoid double-counting livestock.
- Income entries represent the past 7 days from `entry_date`. Period summaries (month / 3 months / year) are computed from `entry_date` ranges, not from a stored period field.
