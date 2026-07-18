# Jump Trading Probability Cup — How the Game Works (Math & Scoring)

A reference for the **Jump Trading Probability Cup** on SportsPredict: **game format** (matches, questions, timing, stages), how forecasts are scored, and how **Relative Brier Points (RBP)** and **Smart Rating** are calculated.

**Source:** [SportsPredict Probability Cup — Developer Guide](https://sportspredict.com/probabilitycup/api) (Jump Trading Probability Cup Model API). This document paraphrases and expands the official rules for readability. If anything conflicts with the live platform, the official documentation and app are authoritative.

---

## Table of contents

1. [What the Probability Cup is](#1-what-the-probability-cup-is)
2. [Game format & structure](#2-game-format--structure)
3. [Events, lobbies, matches, and markets](#3-events-lobbies-matches-and-markets)
4. [What you submit](#4-what-you-submit)
5. [Market lifecycle](#5-market-lifecycle)
6. [Outcomes: YES and NO](#6-outcomes-yes-and-no)
7. [Brier score](#7-brier-score)
8. [Relative Brier Points (RBP)](#8-relative-brier-points-rbp)
9. [Smart Rating and stage weighting](#9-smart-rating-and-stage-weighting)
10. [Worked examples (illustrative math)](#10-worked-examples-illustrative-math)
11. [Why extreme probabilities matter](#11-why-extreme-probabilities-matter)
12. [What the REST API provides](#12-what-the-rest-api-provides)
13. [Leaderboard rules (official FAQ)](#13-leaderboard-rules-official-faq)
14. [Official API rules and limits](#14-official-api-rules-and-limits)
15. [Predictions FAQ (official)](#15-predictions-faq-official)
16. [Glossary](#16-glossary)

---

## 1. What the Probability Cup is

The Jump Trading **Probability Cup** on SportsPredict is a **forecasting competition**, not a traditional sportsbook:

- Participants submit **probabilities** (1–99%) on binary yes/no questions about World Cup matches.
- After each market settles, forecasts are scored with the **Brier score**.
- Performance vs the **crowd average** on each market becomes **Relative Brier Points (RBP)**.
- **Cumulative RBP** (with stage multipliers) feeds **Smart Rating** on the global leaderboard.

From the official docs:

> *The Model API lets predictive models (or any external program) compete on SportsPredict's Probability Cup alongside human users. Submit 1–99 probability predictions on live Probability Cup markets.*

**Lower Brier is better.** **Higher RBP is better.**

The contest rewards **calibrated probabilities**, not just picking the correct side. Saying 51% when the event happens scores worse than saying 80% when it happens. Saying 99% when the event does not happen scores very poorly.

---

## 2. Game format & structure

This section describes **how the contest is organized** — matches, questions, timing, participation, and tournament stages — using only official SportsPredict / Jump Trading sources.

### What you are playing

| Aspect | Official detail |
|--------|-----------------|
| **Contest name** | Jump Trading **Probability Cup** on SportsPredict |
| **Sport** | 2026 **international soccer tournament** (World Cup) |
| **Event window (API example)** | `2026-06-11` through `2026-07-19` |
| **Cost** | **Free** — no entry fee, no stake, no buy-in |
| **Format** | Forecasting competition scored by **Brier** / **Relative Brier Points** — not a sportsbook |
| **Sign-up deadline** | You can join **any time during the World Cup**, including after kickoff of earlier matches, up until the **final match**. Late joiners only score on **remaining** fixtures. |

Sources: [Developer Guide](https://sportspredict.com/probabilitycup/api), [FAQ](https://sportspredict.com/probabilitycup/faq), [Scoring FAQ](https://sportspredict.com/probabilitycup/scoring).

### One event, one lobby, many participants

```
Probability Cup (event)
    └── One shared lobby (everyone joins the same room)
            └── Many matches (World Cup fixtures)
                    └── ~10 markets each (binary yes/no questions)
```

| Layer | Count / rule (official) |
|-------|-------------------------|
| **Events** | One Probability Cup event (`type: "probability"`) |
| **Lobbies** | **One shared lobby** per event — all humans and bots compete in the same pool |
| **Matches** | **104 matches** across the full tournament ([FAQ](https://sportspredict.com/probabilitycup/faq)). The API developer guide also cites **~72 matches** when describing bulk match discovery (~9 KB payload); that figure appears in the context of **group-stage-scale** examples (~720 open markets in one bulk fetch). Treat **104** as the full contest span; treat **~72 / ~720** as API sizing examples for a large open window, not a separate game mode. |
| **Markets (“questions”)** | Roughly **~10 binary questions per match** |
| **Total questions (scale)** | On the order of **~1,000 outcomes** over the full tournament — FAQ states serious participants are expected to predict around **1,000 outcomes across all 104 matches** (consistent with ~10 questions × 104 matches ≈ **~1,040**) |

There is **no** documented sub-lobby, bracket pool, or per-country division. Everyone shares one global leaderboard (subject to eligibility for prizes).

### What counts as a “question” or “market”

Each **market** is exactly **one binary yes/no question** tied to **one match**:

- You answer with a **probability that YES happens** (integer **1–99**).
- There is **no partial credit** — after settlement the outcome is **YES (1)** or **NO (0)**.
- Official API fields include free-text **`question`**, **`status`**, **`closing_time`**, and a nested **`match`** object. There is **no `category` field** in the REST API.

**Official example question:**

> *Will Mexico win the match in regulation?*

The word **“regulation”** in official examples means the result within **90 minutes plus stoppage time** (not extra time or penalties unless a question explicitly says otherwise).

### Question categories — what the API does and does not publish

The platform **does not publish a fixed taxonomy** of market categories (no official list of “player props,” “totals,” “spreads,” etc. in the API). Questions arrive as **plain English strings** in `question`.

From official materials you can infer these **question properties** (not a complete category list):

| Property | Official guidance |
|----------|-------------------|
| **Binary** | Every market is yes/no |
| **Match-linked** | Every market belongs to one fixture |
| **Settlement data** | All resolutions use **Opta Analyst** data exclusively ([FAQ](https://sportspredict.com/probabilitycup/faq)). Match outcomes, goals, player stats, and other event data come from Opta; if other sources disagree, **Opta governs**. |
| **No live crowd price** | Probability markets **omit `current_price`** — you do not see the field’s aggregate probability in the API while predicting |
| **Examples in docs** | Match winner in regulation; both teams to score (illustrative YES/NO table in this doc’s outcomes section) |

SportsPredict creates the question set; participants do **not** choose or create markets. Your job is to price whatever questions are open for each match.

### How many predictions you make

| Rule | Detail |
|------|--------|
| **Per market** | **One** active prediction per market per account (or per bot key). Revise with **PATCH** before close. |
| **Optional skips** | Official scoring FAQ: you **may skip** a question if you truly have **zero** knowledge; random guessing can lose RBP. There is **no** requirement to answer every market. |
| **Volume expectation** | FAQ recommends participating broadly: serious entrants are expected to predict on the order of **~1,000 outcomes** over the full event. Leaderboard rank uses **cumulative** RBP, not average RBP per question — more settled questions means more chances to accumulate points (and more chances to lose points if miscalibrated). |
| **Bots** | Up to **2** active API keys (bots) per user; each bot is a **separate leaderboard row** from manual app picks ([API](https://sportspredict.com/probabilitycup/api)). |
| **LLM benchmarks** | The public leaderboard also shows **frontier model benchmarks** (e.g. Claude, GPT, Gemini) as **independent SportsPredict test entries** — same questions, same Brier rules, prompts locked **30 minutes before kickoff** ([FAQ](https://sportspredict.com/probabilitycup/faq)). These are not mixed into your personal score. |

### Match and question timing

```
Before kickoff          At kickoff (closing_time)        After match
─────────────────       ─────────────────────────        ─────────────
Markets OPEN            Markets CLOSE                    Markets SETTLE
Submit / PATCH          Last probability is final        Brier + RBP computed
Unlimited updates       No more edits                    Leaderboard updates (cached ~1h)
```

| Timing rule | Official detail |
|-------------|-----------------|
| **When questions open** | Markets become available ahead of each match (discover via `GET /matches` / `GET /markets`) |
| **When predictions lock** | **`closing_time` = scheduled match start** — same moment the match kicks off |
| **What gets scored** | Your **last submitted probability before close** |
| **Updates** | **No penalty** for changing your mind repeatedly before kickoff |
| **After kickoff** | No edits — even if the match is still playing |

### Tournament stages and point multipliers

Questions inherit **stage weight** from their match. Official multipliers ([Scoring FAQ](https://sportspredict.com/probabilitycup/scoring), API):

| Stage | RBP multiplier |
|-------|----------------|
| **Group stage** | **1×** (base) |
| **Elimination / knockout rounds** | **2×** |
| **Final** | **3×** |

Multipliers apply to **both gains and losses**. A −5 base RBP in the final becomes −15. Late knockout and final predictions can **reshape the leaderboard** even after a weak group stage (official scoring FAQ encourages continuing through the tournament).

### End-to-end participant flow (official)

1. **Create account** on SportsPredict (free).
2. **Open the Probability Cup event** in the app — this **auto-joins** the shared lobby.
3. **Browse matches** and their open questions, **or** connect a bot via REST/MCP.
4. **Submit probabilities (1–99)** on any markets you choose before each kickoff.
5. **Update** predictions as news changes (injuries, lineups, etc.) until close.
6. After settlement, earn or lose **RBP vs the field**; **Smart Rating** updates on the global leaderboard (settled markets only).

### What winning means (official prize framing)

Prize details are governed by the **Official Rules** ([FAQ](https://sportspredict.com/probabilitycup/faq)). Public materials describe:

- **1st place:** Jump Trading **Probability Fellowship** (10-week, paid, in-person Chicago) — primary FAQ prize description.
- **2nd–5th:** Tablet (~$1,000 retail value).
- **6th–10th:** ~$200 event-ticket gift card.
- **Marketing copy** on the scoring page also references a **$1M live prediction-market portfolio** for the winner; if any descriptions conflict, the **Official Rules** and verified winner communications prevail.

Eligibility for the Fellowship and other prizes requires meeting age, work-authorization, and verification requirements in the Official Rules (international **participation** is welcome; Fellowship **winners** must be authorized to work in the U.S.).

---

## 3. Events, lobbies, matches, and markets

| Object | Official description |
|--------|------------------------|
| **Event** | A Probability Cup tournament. API events have `type: "probability"` (Brier-scored). Example dates: 2026-06-11 → 2026-07-19. |
| **Lobby** | The shared competition room for an event. You join the lobby to participate. Joining is free. |
| **Match** | One fixture (e.g. `Mexico vs South Africa`). **104 matches** span the full contest ([FAQ](https://sportspredict.com/probabilitycup/faq)); API examples use **~72** matches / **~720** markets when describing group-stage-scale bulk responses. |
| **Market** | One binary question tied to a match. Roughly **~10 markets per match** (~4 KB per match in API responses). |

Example question (from API docs):

> *Will Mexico win the match in regulation?*

Each market includes:

- **`status`**: e.g. `open`, `closed`, `settled`
- **`closing_time`**: matches the **match start time** — predictions must be submitted before this moment
- A **`match`** object (name, kickoff, etc.)

**Official note:** Probability-event markets **do not include a `current_price` field**. Your prediction stands on its own and is scored against the eventual outcome. The crowd aggregate used for RBP is computed by the platform; it is **not** exposed as a live per-market price in the REST API.

---

## 4. What you submit

### Probability format

| Rule | Detail |
|------|--------|
| **Input** | Integer **1–99** inclusive |
| **Meaning** | Your probability that the answer is **YES** |
| **Internal storage** | Scaled to a **0–1 decimal** (e.g. 75 → 0.75) |
| **Rejected values** | **0 and 100** — edge values are rejected; **1 and 99** are the strongest allowed stances |

| Submitted | Internal *p* | Interpretation |
|-----------|--------------|----------------|
| 75 | 0.75 | 75% chance YES |
| 50 | 0.50 | Even chance |
| 12 | 0.12 | 12% chance YES (strong lean NO) |
| 1 | 0.01 | Strongest NO lean allowed |
| 99 | 0.99 | Strongest YES lean allowed |

### One prediction per market

- **One prediction per market per user** (or per bot/API key).
- To revise: **`PATCH /predictions/{id}`** before the market closes.
- **The latest value at market close is what gets scored.**

### Integration paths (official)

- **REST API** — for custom models and scripts
- **MCP (Model Context Protocol)** — for AI assistants (Claude, Cursor, ChatGPT); same auth and scoring

---

## 5. Market lifecycle

```
OPEN     →  Submit (POST) or update (PATCH) predictions
   │
   │  closing_time (match kickoff)
   ▼
CLOSED   →  No more edits; awaiting result
   │
   │  result determined
   ▼
SETTLED  →  Brier score computed; counts toward leaderboard metrics
```

Official FAQ:

- **Leaderboards only count closed/settled markets** — open predictions are excluded.
- Leaderboards **cache for up to 1 hour**, refreshed when markets transition to closed/settled.
- You **can update** a prediction until close; you **cannot cancel/delete** via the documented API — use PATCH to change your probability.

---

## 6. Outcomes: YES and NO

Each binary market resolves to a single outcome:

```
o = 1   if YES (the event happened)
o = 0   if NO  (the event did not happen)
```

Examples:

| Question | YES (*o* = 1) | NO (*o* = 0) |
|----------|-----------------|--------------|
| Will Mexico win in regulation? | Mexico wins in 90 minutes + stoppage | Draw or Mexico does not win |
| Will both teams score? | Both teams score at least one goal | At least one team does not score |

There is no partial credit after settlement.

---

## 7. Brier score

Official formula (from SportsPredict scoring documentation):

```
Brier = (p − o)²
```

Where:

- **p** = your probability as a decimal (from your 1–99 submission)
- **o** = outcome (0 or 1)

**Lower is better.** A perfect forecast scores **0**. The worst possible score on a single market is **1**.

### If YES happens (*o* = 1)

```
Brier = (p − 1)² = (1 − p)²
```

| Submitted | *p* | Brier |
|-----------|-----|-------|
| 99 | 0.99 | 0.0001 |
| 75 | 0.75 | 0.0625 |
| 50 | 0.50 | 0.25 |
| 25 | 0.25 | 0.5625 |
| 1 | 0.01 | 0.9801 |

### If NO happens (*o* = 0)

```
Brier = p²
```

| Submitted | *p* | Brier |
|-----------|-----|-------|
| 1 | 0.01 | 0.0001 |
| 25 | 0.25 | 0.0625 |
| 50 | 0.50 | 0.25 |
| 75 | 0.75 | 0.5625 |
| 99 | 0.99 | 0.9801 |

### Example using API integer input

Submit **75**, outcome **YES**:

```
p = 0.75
Brier = (0.75 − 1)² = 0.0625
```

After settlement, **`GET /results`** returns `probability_submitted` and `brier_score` for each of your settled predictions. `brier_score` is **null** until the market settles.

---

## 8. Relative Brier Points (RBP)

Official formula:

```
RBP = (crowd_brier − user_brier) × 100
```

Where:

- **user_brier** = your Brier on that market
- **crowd_brier** = the crowd average Brier on that market (computed by SportsPredict; not returned per-market in `GET /results`)

### Interpretation (official)

| RBP | Meaning |
|-----|---------|
| **Positive** | You beat the crowd on that market |
| **Zero** | You matched the crowd |
| **Negative** | The crowd beat you |

### Illustrative calculation

You beat the crowd:

```
crowd_brier = 0.25
user_brier  = 0.0625
RBP = (0.25 − 0.0625) × 100 = +18.75
```

Crowd beats you:

```
crowd_brier = 0.10
user_brier  = 0.9025
RBP = (0.10 − 0.9025) × 100 = −80.25
```

### Aggregate scoring

Official docs:

> *Cumulative RBP across all markets you've predicted determines your Smart Rating (a percentile vs all participants).*

Stage multipliers apply to this aggregate (see next section).

**Note:** Aggregate RBP and Smart Rating are surfaced on the **SportsPredict frontend / leaderboard service**. The REST **`GET /results`** endpoint returns per-prediction `brier_score` only — not per-market RBP or crowd Brier.

---

## 9. Smart Rating and stage weighting

### Smart Rating

From the official FAQ:

- **Smart Rating** is a **percentile vs all participants**, driven by **cumulative RBP** on settled predictions.
- **Eligibility:** at least **one settled prediction**.

### Stage weighting (official)

| Stage | Multiplier |
|-------|------------|
| Group stage | **1×** |
| Knockout | **2×** |
| Final | **3×** |

Later-stage markets contribute more to your standing.

### Separate leaderboard entries (official FAQ)

> *Each API key is a separate leaderboard entry, and your manual app picks are a separate entry from those. So your account ("you") plus your model entries all compete on the same leaderboard.*

- Up to **2 active bots (API keys)** per account.
- Manual picks in the app and each bot are tracked separately on the leaderboard.

---

## 10. Worked examples (illustrative math)

These examples use **hypothetical** crowd values to show the math. Crowd Brier is not published per-market in the API.

### Example A — Beat the crowd (better calibration)

**Question:** Will the match have 3+ total goals?  
**Outcome:** YES (*o* = 1)

| Party | Submit | *p* | Brier |
|-------|--------|-----|-------|
| Crowd (hypothetical) | 55 | 0.55 | 0.2025 |
| You | 68 | 0.68 | 0.1024 |

```
RBP = (0.2025 − 0.1024) × 100 = +10.01
```

---

### Example B — Right side, lose RBP (underconfident vs crowd)

**Question:** Will the favorite win?  
**Outcome:** YES (*o* = 1)

| Party | Submit | *p* | Brier |
|-------|--------|-----|-------|
| Crowd (hypothetical) | 62 | 0.62 | 0.1444 |
| You | 51 | 0.51 | 0.2401 |

```
RBP = (0.1444 − 0.2401) × 100 = −9.57
```

You leaned YES and YES occurred, but the crowd was **more accurately confident** than you.

---

### Example C — High confidence, wrong outcome

**Question:** Will a specific event occur?  
**Outcome:** NO (*o* = 0)

| Party | Submit | *p* | Brier |
|-------|--------|-----|-------|
| You | 95 | 0.95 | 0.9025 |
| Crowd (hypothetical) | 40 | 0.40 | 0.1600 |

```
RBP = (0.16 − 0.9025) × 100 = −74.25
```

Brier punishes **confident wrong** forecasts heavily because the formula is squared.

---

### Example D — Strong NO forecast

**Question:** Will a low-probability event occur?  
**Outcome:** NO (*o* = 0)

| Party | Submit | *p* | Brier |
|-------|--------|-----|-------|
| Crowd (hypothetical) | 35 | 0.35 | 0.1225 |
| You | 8 | 0.08 | 0.0064 |

```
RBP = (0.1225 − 0.0064) × 100 = +11.61
```

---

### Example E — PATCH before close (official rule)

Official FAQ:

> *The latest value at market close is what gets scored.*

1. Submit **72%** on a market.
2. Later **PATCH to 58%** before kickoff.
3. Market closes at **58%** — only **58%** is scored.

If outcome is YES:

```
Brier = (0.58 − 1)² = 0.1764
```

Not the Brier from the original 72%.

---

## 11. Why extreme probabilities matter

Because **Brier = (p − o)²**, errors grow **quadratically** with distance from the outcome.

### Outcome NO (*o* = 0): Brier = *p*²

| Submit | Brier |
|--------|-------|
| 50 | 0.25 |
| 70 | 0.49 |
| 90 | 0.81 |
| 95 | 0.9025 |
| 99 | 0.9801 |

### Outcome YES (*o* = 1): Brier = (1 − *p*)²

| Submit | Brier |
|--------|-------|
| 50 | 0.25 |
| 70 | 0.09 |
| 90 | 0.01 |
| 95 | 0.0025 |
| 99 | 0.0001 |

Official docs note that **0 and 100 are rejected** so that Brier behavior stays meaningful — **1 and 99** are the strongest available positions.

---

## 12. What the REST API provides

### Available via REST (official endpoints)

| Endpoint | Purpose |
|----------|---------|
| `GET /events` | Find Probability Cup event |
| `GET /lobbies` | Get lobby; join with `POST /lobbies/{id}/join` |
| `GET /matches` | List matches (~72), kickoffs, open market counts |
| `GET /markets` | List markets (filter by `match_id` recommended for LLM clients) |
| `POST /predictions` | Submit one prediction |
| `POST /predictions/batch` | Submit up to **50** predictions at once |
| `PATCH /predictions/{id}` | Update probability before close |
| `GET /predictions` | Your current predictions |
| `GET /results` | **Settled** predictions with **`brier_score`** |

### Not exposed in REST (official)

| Data | Notes |
|------|-------|
| **Crowd probability per market** | No `current_price` on probability markets |
| **Crowd Brier per market** | Used internally for RBP |
| **RBP per market** | Computed server-side |
| **Smart Rating / aggregate RBP** | Shown on SportsPredict frontend leaderboard |

Authentication: `Authorization: Bearer sp_live_<your_key>`

---

## 13. Leaderboard rules (official FAQ)

1. **Scoring:** Brier methodology; RBP vs crowd as defined above.
2. **Settled only:** Open markets do not count toward leaderboard standing.
3. **Cache:** Leaderboards may lag up to **~1 hour** after settlements.
4. **Smart Rating:** Percentile from cumulative weighted RBP; requires ≥1 settled prediction.
5. **Historical data:** `GET /results` gives your settled rows and `brier_score`; aggregate RBP/Smart Rating is on the frontend.
6. **Competing with yourself:** Manual app entry and each bot key are separate leaderboard rows.

### Sample settled result (API shape)

```json
{
  "question": "Will Mexico win the match in regulation?",
  "probability_submitted": 75,
  "brier_score": 0.0625,
  "market_status": "settled"
}
```

---

## 14. Official API rules and limits

| Rule | Official detail |
|------|-----------------|
| Probability range | Integer **1–99** |
| Rate limit | **60 requests/minute** per IP (REST + MCP) |
| Batch size | Up to **50** predictions per batch POST |
| Bots per account | **Up to 2** active API keys |
| API key | Prefix `sp_live_`; shown **once** at creation |
| One per market | One prediction per market per user; use PATCH to revise |
| Scored value | Latest probability at **market close** |
| Update until close | Yes — PATCH `/predictions/{id}` |
| Delete prediction | Not documented — update in place |
| Batch failures | Partial success; failed entries reported individually |

---

## 15. Predictions FAQ (official)

**Can I update or cancel a prediction?**  
Yes — until the market closes. Use `PATCH /predictions/{id}`. Latest value at close is scored.

**What probability range?**  
Integer 1–99. Stored internally as 0–1 decimal. Values 0 and 100 are rejected.

**POST vs batch?**  
Batch is preferred for volume (fewer requests, stays under rate limits).

**What if one batch entry fails?**  
Others still succeed; response lists per-market success/failure.

**Will my model compete against my manual picks?**  
Yes — separate leaderboard entries by design.

**Why isn't my prediction on the leaderboard yet?**  
Markets must settle; leaderboard cache may take up to an hour.

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **Probability Cup** | Jump Trading forecasting contest on SportsPredict (Brier-scored) |
| **Market** | One binary yes/no question on a match (~10 per fixture) |
| **Match** | One World Cup fixture; 104 across the full tournament |
| **Lobby** | Single shared competition room for the Probability Cup |
| **Regulation** | 90 minutes + stoppage (unless question specifies otherwise) |
| **Opta Analyst** | Official settlement data source for all markets |
| **p** | Your YES probability (0–1 internally; 1–99 submitted) |
| **o** | Outcome: 1 = YES, 0 = NO |
| **Brier score** | (p − o)² — lower is better |
| **crowd_brier** | Average Brier of participants on that market (platform-computed) |
| **RBP** | Relative Brier Points = (crowd_brier − user_brier) × 100 |
| **Smart Rating** | Percentile rank from cumulative RBP (frontend leaderboard) |
| **Stage weight** | Group 1×, knockout 2×, final 3× |
| **closing_time** | When predictions lock (typically match kickoff) |

---

## Quick reference (official formulas)

```
Submit:     integer 1..99  (YES probability %)
Outcome:    o ∈ {0, 1}

Brier      = (p − o)²                 minimize
RBP        = (crowd_brier − user_brier) × 100   maximize

Stage weights:  group 1×  |  knockout 2×  |  final 3×
Smart Rating:   cumulative RBP percentile (settled markets only)
```

---

*Official documentation: [https://sportspredict.com/probabilitycup/api](https://sportspredict.com/probabilitycup/api)*
