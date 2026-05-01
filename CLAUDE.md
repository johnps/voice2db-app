# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Voice-to-Structured-Data Capture System for field workers monitoring agricultural beneficiaries (e.g. smallholder farmers in rural India). Replaces touch-based form filling with voice input that is transcribed, interpreted by an LLM, and used to update beneficiary records.

See `voice_to_data_brief.md` for the full client brief.

## Architecture

### Stack
- **Mobile**: React Native + Expo (iOS + Android)
- **Backend/DB**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **STT**: Whisper tiny via `whisper.rn` (on-device, offline-capable)
- **LLM extraction**: Claude API — `claude-haiku-4-5` default, `claude-sonnet-4-6` fallback
- **Auth**: Supabase phone OTP (SMS)

### Core Flow
1. Worker selects beneficiary from their assigned list
2. Worker records voice (10–60 sec)
3. Whisper transcribes on-device immediately
4. Worker reviews raw transcript, can correct text
5. LLM extraction queued (fires when connectivity returns)
6. Worker sees editable confirmation screen — each field rendered by type (number, boolean, string)
7. Worker confirms → append-only update written to DB

**Invariant:** Never silently update records. Always confirm before save.

### Offline Strategy
Field workers operate in areas with no or intermittent connectivity (rural India). Every step is designed around this:

- **STT**: Runs on-device (Whisper tiny) — no network needed
- **LLM extraction**: Queued locally, fires automatically when connectivity returns
- **DB updates**: Queued and synced when connected
- **Pending confirmations**: Workers batch-confirm extractions at end of day when signal returns. A badge shows count of pending items.

Never block the recording workflow on network availability.

### Database Schema (Supabase/Postgres)

**Key tables:**
- `workers` — linked to Supabase Auth, assigned to beneficiaries
- `beneficiaries` — one per person, with a fixed JSON schema defining their fields
- `worker_beneficiary` — assignment join table (workers only see assigned beneficiaries)
- `beneficiary_updates` — append-only log; each confirmed recording = one row with `worker_id`, `beneficiary_id`, `timestamp`, `transcript`, `audio_url`, `json_diff`
- Current beneficiary state = a view/function taking the latest value per field from `beneficiary_updates`

**Schema type:** Fixed JSON per beneficiary type for now. Dynamic per-type schema is a planned future extension.

### STT Model
- **Whisper tiny** (~75MB) bundled at install — chosen for 2018-era Android devices (2–3GB RAM, Snapdragon 6xx)
- Show raw transcript to worker before LLM extraction so obvious mishears can be corrected
- Architecture supports swapping to Whisper small/medium for newer devices or Hindi/multilingual support later

### Audio Retention
- Uploaded to Supabase Storage on sync
- Auto-deleted after 30 days via a scheduled Edge Function
- Deleted from device immediately after successful upload

### LLM Extraction
- Claude API receives: the corrected transcript + the target JSON schema for this beneficiary type
- Returns: a JSON diff of only the fields mentioned in the recording (partial update)
- Haiku for cost; promote to Sonnet if extraction accuracy falls below 80% target

### Auth & Access
- Workers log in via phone number OTP (Supabase Auth)
- Workers see only their assigned beneficiaries (filtered by `worker_beneficiary`)
- Admin manages workers and assignments directly in the Supabase dashboard (no custom admin UI for now)

## Success Metrics
- < 30 sec per entry (recording to confirmation)
- ≥ 80% extraction accuracy
- ≥ 50% reduction vs. form-based entry time

## Planned Future Extensions
- Dynamic schema per beneficiary type (vs. fixed schema today)
- Hindi and regional Indian language support (swap Whisper tiny → small/medium multilingual)
- Custom admin UI for worker and assignment management
