# Reality Cup — Design & Scoring

**Tagline:** *Price the probability. Beat the machines. Find the fake.*

A competitive **deepfake-detection game** using **still images only**. Instead of a binary real/fake swipe, players assign a calibrated probability:

> *“There is an 82% chance this image is a deepfake.”*

The goal is **not merely to guess correctly**. Players must **correctly price their uncertainty**.

Hackathon build target: this repo (`ramphackathon` — Expo + Supabase).

---

## Table of contents

1. [Concept](#1-concept)
2. [Core gameplay](#2-core-gameplay)
3. [Scoring (Brier + RBP)](#3-scoring-brier--rbp)
4. [Human versus AI](#4-human-versus-ai)
5. [Ranking & prizes](#5-ranking--prizes)
6. [Strong demo flow](#6-strong-demo-flow)
7. [Hackathon MVP scope](#7-hackathon-mvp-scope)
8. [Data model (Supabase)](#8-data-model-supabase)
9. [Post-MVP features (strictly post-MVP)](#9-post-mvp-features-strictly-post-mvp)
10. [Name options](#10-name-options)
11. [Glossary](#11-glossary)

---

## 1. Concept

### What we are building

| Layer | Reality Cup |
|-------|-------------|
| **Session** | One hackathon event or live room |
| **Sample** | One **image** (real or AI-generated / manipulated) |
| **Question** | *“What is the probability this image is a **fake**?”* |
| **Input** | Slider **1 (Real) ←→ 99 (Fake)** — integer **1–99** only |
| **Outcome** | Ground truth: **fake (1)** or **real (0)** |
| **Per-sample score** | **Brier** → converted to **RBP vs crowd** — see [§3](#3-scoring-brier--rbp) |
| **Leaderboard** | Cumulative **RBP** |
| **Room** | Live multiplayer session (QR join) |
| **Models** | Image detection models on the same samples |
| **Scale (MVP)** | **15–25 images** per session → **20 images** in full Cup mode (post-MVP) |

The game rewards **calibration**, not raw accuracy. Saying **51% fake** on a fake image is technically on the right side but scores poorly versus **90% fake**.

### Why not rank on accuracy alone?

If you rank by “got the side right,” players can enter **51% on everything** and look competitive while contributing no real information. Reality Cup ranks on **Relative Brier Points (RBP)** — how your calibration compares to the **crowd** on each image — so confident, accurate forecasts win.

---

## 2. Core gameplay

### The question (every image)

For each sample, the player moves a slider:

```
Real (1)  ←────────────────────────→  Fake (99)
```

They submit an integer **1–99**: their probability the image is **fake**. Values **0 and 100 are not allowed** — you must express some uncertainty, same as probability-cup forecasting rules.

Internally: `p = submitted_value / 100` (e.g. 82 → 0.82).

**Optional (MVP+):** short free-text *“Identify the tell”* after locking the slider — for reveal/education, not primary scoring.

### Round flow

```
1. SHOW image (preloaded, curated — not arbitrary upload)
2. PLAYER sets slider (1–99) + submits
3. LOCK predictions for that sample
4. REVEAL:
      - Ground truth (Real / Fake)
      - Your value vs Crowd vs Model A vs Model B (all on same 1–99 axis)
      - RBP for this sample
      - Optional: explanation of the tell
5. UPDATE leaderboard
6. NEXT image
```

After submit, the reveal screen shows **all participants on the same axis**:

```
You:           78% fake
Crowd:         64% fake
Model A:       91% fake
Model B:       38% fake
Ground truth:  Fake
```

### Central competition

> **Can humans detect synthetic images better than AI — and better than the crowd — when scored on calibration, not vibes?**

---

## 3. Scoring (Brier + RBP)

Reality Cup uses the same probability-scoring model as a **probability forecasting cup**:

1. **Brier score** per image — measures calibration vs ground truth (lower is better).
2. **Relative Brier Points (RBP)** per image — measures calibration vs the **crowd** (higher is better).
3. **Leaderboard** — **cumulative RBP** across all images in the session.

There is no separate “accuracy points” layer. **RBP is the score.**

### What you submit

| Rule | Detail |
|------|--------|
| **Input** | Integer **1–99** inclusive |
| **Meaning** | Probability the image is **fake** |
| **Internal *p*** | `submitted / 100` (e.g. 75 → 0.75) |
| **Rejected** | **0 and 100** — strongest allowed stances are **1** (almost certainly real) and **99** (almost certainly fake) |
| **One per image** | One prediction per image per player; revise before lock if the round is still open |

### Outcome

```
y = 1   when the image is FAKE
y = 0   when the image is REAL
```

### Brier score (minimize)

```
Brier = (p − y)²
```

**Lower is better.** Perfect forecast → **0**. Worst possible → **1**.

| Ground truth | Intuition |
|--------------|-----------|
| **Fake** (*y* = 1) | High *p* → low Brier. Low *p* → catastrophic Brier. |
| **Real** (*y* = 0) | Low *p* → low Brier. High *p* → catastrophic Brier. |

#### Fake image (*y* = 1) — Brier = (1 − *p*)²

| Submitted | *p* | Brier |
|-----------|-----|-------|
| 99 | 0.99 | 0.0001 |
| 90 | 0.90 | 0.01 |
| 70 | 0.70 | 0.09 |
| 51 | 0.51 | 0.2401 |
| 50 | 0.50 | 0.25 |
| 10 | 0.10 | 0.81 |
| 1 | 0.01 | 0.9801 |

#### Real image (*y* = 0) — Brier = *p*²

| Submitted | *p* | Brier |
|-----------|-----|-------|
| 1 | 0.01 | 0.0001 |
| 10 | 0.10 | 0.01 |
| 50 | 0.50 | 0.25 |
| 90 | 0.90 | 0.81 |
| 99 | 0.99 | 0.9801 |

### Relative Brier Points — RBP (maximize)

After each image settles:

```
RBP = (crowd_brier − user_brier) × 100
```

Where **crowd_brier** = average Brier of all **human** players in the room on that image.

| RBP | Meaning |
|-----|---------|
| **Positive** | You were **better calibrated** than the crowd |
| **Zero** | You matched the crowd |
| **Negative** | The crowd beat you |

**Session score:** sum of RBP across all images you played.

Example — image is **fake**, crowd averaged **0.25** Brier, you scored **0.01**:

```
RBP = (0.25 − 0.01) × 100 = +24
```

Example — you submitted **95% fake**, image was **real** (*y* = 0):

```
user_brier = 0.95² = 0.9025
crowd_brier = 0.20  (hypothetical)
RBP = (0.20 − 0.9025) × 100 = −70.25
```

Overconfidence when wrong is punished **quadratically**.

### Per-round reveal

Show on each reveal card:

- Your submitted **1–99**
- **Brier** on that image (optional, for transparency)
- **RBP** on that image (primary round feedback: “+24 RBP”)

### What we show vs what we rank

| Metric | Use |
|--------|-----|
| **RBP** (per image + cumulative) | **Primary score** — reveal, leaderboard, prizes |
| **Brier** | Per-image accuracy detail |
| Raw accuracy (% correct side) | **Display only** — never primary rank |

---

## 4. Human versus AI

Every image is evaluated by:

| Participant | Role |
|-------------|------|
| **The player** (or team) | Human calibration |
| **Crowd average** | Mean submitted *p* across all humans in the room |
| **Two or three detection models** | Prerecorded or live API probabilities (1–99 scale) |
| **Ground truth** | Curator-labeled real/fake |

After each round, show all values on the **same 1–99 axis** (see §2).

### Example leaderboard (cumulative RBP)

```
Sofia              9,480
Detector Model A   9,310
Team Codex         9,240
Alejo              9,120
```

Models and humans share the **same Brier/RBP math** on the **same images**. Only **humans** are eligible for cash prizes unless you run a separate model track post-MVP.

### MVP model strategy

- **One model** can call a real image-detection API at runtime.
- **Other models:** run **offline**, store `(sample_id, model_name, probability)` in Supabase before the event.
- Do **not** analyze arbitrary user uploads live — latency, reliability, and dataset control kill the demo.

---

## 5. Ranking & prizes

Rank by **cumulative RBP** across the session. **Cash prizes** are the incentive — no ceremonial titles.

### Podium (MVP)

| Place | Prize |
|-------|-------|
| **1st** | Cash — top prize |
| **2nd** | Cash |
| **3rd** | Cash |
| **4th–10th** | Shown on final leaderboard (prize optional / sponsor-dependent) |

Set exact dollar amounts based on hackathon budget. Example structure:

```
1st   $500
2nd   $250
3rd   $100
```

Ties: split the affected prize pool or use average Brier as tie-break (lowest wins).

### Eligibility

- Must play the full MVP session (or minimum image count TBD, e.g. ≥10 of 15).
- One entry per person unless running an explicit team mode (post-MVP).

---

## 6. Strong demo flow

Audience-first flow for the hackathon room:

1. **Scan QR code** → join live Supabase room.
2. **Everyone** sets deepfake probability on the same **image**.
3. **Two AI models** show prerecorded (or one live) probabilities.
4. **Live chart** — histogram of audience submissions before reveal.
5. **Reveal** — real or fake + tell explanation.
6. **RBP updates** on screen and leaderboard.
7. After **~10 rounds**, players appear on the **session leaderboard**.
8. **Final podium** — top 3 cumulative RBP win **cash**.

The entire room participates in each reveal — not a private swiper.

---

## 7. Hackathon MVP scope

**Time-box:** avoid real-time analysis of arbitrary uploads. **Images only** — no video, no audio.

### Build (in scope)

| Feature | Detail |
|---------|--------|
| **15–25 preselected labeled images** | Curated URLs in Supabase; mix real/fake |
| **Probability slider** | 1 Real ↔ 99 Fake (integer) |
| **Optional “identify the tell”** | Text field; reveal-only |
| **Live multiplayer rooms** | QR → `room_id`; Supabase Realtime |
| **Leaderboard** | Cumulative RBP |
| **Two prerecorded model predictions per image** | Seeded in DB |
| **Reveal screen** | You / Crowd / Models / Truth + RBP |
| **Final podium** | Top 3 by RBP → **cash prizes** |

### Do not build for MVP

- Video or audio samples
- Arbitrary user image upload + live deepfake pipeline
- Survival Mode lives (post-MVP)
- Team consensus merge UI (post-MVP — see §9)
- Full 20-image Cup mode (post-MVP — same engine, different session config)

### Repo stack (`ramphackathon`)

Current starter ([README.md](./README.md)):

```
Expo SDK 57 / React Native  →  mobile client + Expo Go demo
Supabase                    →  rooms, samples, predictions, leaderboard
supabase/schema.sql         →  extend beyond demo `notes` table
```

Suggested screens:

```
JoinRoom (QR / code)
  → PlayRound (slider + submit)
  → Reveal (comparison bars + RBP)
  → Leaderboard (cumulative RBP)
  → Podium (top 3 + cash)
```

Optional: **projector view** (web or second route) subscribing to the same Supabase room for histogram + reveal.

---

## 8. Data model (Supabase)

Minimal schema extension for MVP (conceptual — implement in `supabase/schema.sql` when building):

```
rooms              id, name, code, status, created_at
samples            id, room_id?, image_url, ground_truth, tell_text, order_index
model_predictions  sample_id, model_name, probability   -- integer 1..99
players            id, display_name, room_id, created_at
predictions        id, sample_id, player_id, probability, tell_text?, submitted_at
```

**Scoring job** (Edge Function or client after lock):

```typescript
// probability: integer 1..99, y: 0 | 1
const p = probability / 100;
const brier = (p: number, y: number) => (p - y) ** 2;
const rbp = (userBrier: number, crowdBrier: number) => (crowdBrier - userBrier) * 100;
```

**Crowd display value:** mean of human `probability` on that image.  
**Crowd Brier:** mean of human Briers on that image (models excluded).

Realtime: `predictions` insert + room channel for live histogram during open round.

---

## 9. Post-MVP features (strictly post-MVP)

Do **not** scope these into the hackathon MVP. Same scoring engine; different session configs.

### 1. Full Cup mode

**Twenty images.** Highest cumulative RBP wins. Larger prize pool.

### 2. Human vs. Machine

Dedicated track comparing human RBP vs model RBP on identical image sets.

### 3. Live Crowd Mode

Everyone at the venue scans QR and answers **simultaneously**. Big screen shows probability **distribution** before ground-truth reveal.

### 4. Team Consensus

Teams discuss each image and submit **one** probability.

### 5. Survival Mode

A badly overconfident prediction costs a **life**. Three major mistakes → eliminated. Define “major” as e.g. Brier > 0.5 or RBP < −40 on an image.

### 6. Bonus awards (optional prizes)

| Award | Criteria |
|-------|----------|
| **Best AI Model** | Top model by cumulative RBP |
| **Best-Calibrated Player** | Lowest average Brier |
| **Human Who Beat the Machines** | Best human with RBP > best model |

---

## 10. Name options

| Name | Notes |
|------|-------|
| **Reality Cup** ✓ | **Recommended** — short, podium-friendly |
| Deepfake Probability Cup | Explicit |
| Proof or Spoof | Punchy |
| TrueScore | Product-y |
| FakeOdds | Market metaphor |
| Veracity | Serious tone |
| Human vs. Synthetic | Mode name as product name |
| RealityRank | Leaderboard vibe |
| Trust Market | Prediction-market echo |
| The Authenticity Games | Longer, event-style |

**Primary name:** **Reality Cup**  
**Tagline:** *Price the probability. Beat the machines. Find the fake.*

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Sample** | One **image** with curator ground truth (real or fake) |
| **p** | Predicted probability image is **fake** (0–1 internally; 1–99 submitted) |
| **y** | Outcome: 1 = fake, 0 = real |
| **Brier** | (p − y)² — lower is better |
| **RBP** | Relative Brier Points = (crowd_brier − user_brier) × 100 — higher is better |
| **Crowd** | All human players in the room (models excluded from crowd average) |
| **Reveal** | Post-lock screen showing truth + all probabilities + RBP |
| **Room** | Live multiplayer session |

---

## Quick reference

```
Submit:     integer 1..99  (probability image is fake %)
Internal:   p = submitted / 100
Outcome:    y = 1 (fake) | y = 0 (real)

Brier      = (p − y)²                           minimize
RBP        = (crowd_brier − user_brier) × 100   maximize

Rank by:    cumulative RBP (not raw accuracy)
Prizes:     cash to top 3 on podium
MVP:        15–25 curated images · Expo + Supabase · prerecorded models
```
