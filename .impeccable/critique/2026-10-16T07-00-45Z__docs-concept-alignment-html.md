---
target: ParkAid mockups (concept-alignment.html)
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Portfolio\\parkaid\\docs\\concept-alignment.html"
target_fingerprint: "sha256:4167b4e6e8ab48950c946b796d82b7b9a190e103a5a48ae2e5f2a6965985ecea"
target_path: "C:\\Portfolio\\parkaid\\docs\\concept-alignment.html"
timestamp: 2026-10-16T07-00-45Z
slug: docs-concept-alignment-html
---
Method: dual-agent (A: design-review subagent, B: detector subagent). Live browser overlay skipped: local file, browser pane cannot run it live; B checked 2x renders of each screen instead.

Target: the five app screens in docs/concept-alignment.html (Welcome is icon-only).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Timer and "Ends at" clear; Map shows no you-are-here dot and no selected pin |
| 2 | Match System / Real World | 2 | Stephen Avenue labelled "9 Ave SW" and "On-street"; no ParkPlus zone number |
| 3 | User Control and Freedom | 2 | Back chevron on the Park tab root; End session has no confirm or undo |
| 4 | Consistency and Standards | 2 | Home chips (Covered) differ from Map chips (Under $5); price ink on one screen, teal on another |
| 5 | Error Prevention | 1 | Start session shows no duration or total; Extend ignores the 2-hour maximum |
| 6 | Recognition Rather Than Recall | 3 | Vehicle and spot carry through; Map pins unlabeled |
| 7 | Flexibility and Efficiency | 2 | Top pick is a good shortcut; no recents, favourites or directions hand-off |
| 8 | Aesthetic and Minimalist Design | 3 | Calm and restrained; some filler copy |
| 9 | Error Recovery | 1 | No offline, expired or failed-payment state designed |
| 10 | Help and Documentation | 2 | Good inline hints; rate basis never explained |
| Total | | 20/40 | Acceptable |

Mockups show the happy path only; 5 and 9 are low partly because those states are not drawn yet.

## Design Specificity Verdict

LLM assessment: parking-specific, not Calgary-specific. Calgary is mostly nouns. Authored: the headline, the Covered chip (winter need), "Check street signs before leaving your car." The rest (teal pin, system sans, greeting, chips, cards, sheet) is category-standard. Factual error: Stephen Avenue is 8 Ave SW and a daytime pedestrian mall. Biggest missed detail is free: the API already returns zone_info.parking_zone and max_time.

Deterministic scan: 73 findings, exit 2. 70 false positives: 68 contrast pairs mixing dark-theme text with light surfaces (the parser reads both theme blocks), 3 cramped-padding hits on the table wrapper and the edge-to-edge tab bar. Real: none inside the app screens; amber tags on the plan page (.tag.new, .alert b, .you) at 3.7 to 4.2:1. Missed by the detector, found by B: chips 34.8pt, Home "View parking" 39.3pt, back row 22.7pt (all under 44pt); Map tab bar hidden under the map layer (markup bug: .tabs has no z-index); location dot hidden under the sheet; Map search inset 19.6 vs sheet 22.5.

Visual overlays: none available.

## Overall Impression

Calm, restrained, on-brand; the flow is right. Biggest gap: the money moments. Start session and the last minutes of a session are where a driver gets a ticket or overpays, and both are drawn as if nothing can go wrong.

## What's Working

1. "A little less circling. A little more city." with "Browse first. No account needed." lowers first-step commitment; the icon-only Welcome has single focus.
2. Absolute time beside the countdown ("Ends at 4:30 PM") and honest constraints ("2 hour maximum", "Check street signs").
3. Restraint: one accent, primary CTAs in the thumb zone on Welcome, Map and Details, a top pick that cuts choice.

## Priority Issues

1. [P1] Start session commits blind. Why: highest-stakes tap with no duration, total, zone or plate check; today's SetupCard already has duration and total. Fix: duration stepper plus a summary line ("2 h · $9.00 · Zone 1234 · ABC 123") above the button; cap options at the spot's max_time. Command: /impeccable shape
2. [P1] No protection when time runs out. Why: warning at 5 minutes equals the 5-minute walk back, colour only; Extend shows no price and ignores the 2-hour max; End sits 12pt under Extend and is the louder button on ink. Fix: warn at walk time + 10 min in text; "We'll remind you at 4:15 PM"; "+30 min · $2.25"; cap state "Max reached. Move by 4:30"; End as a quiet outline with more space. Command: /impeccable harden
3. [P1] Map is not glanceable. Why: identical unlabeled pins force tapping each; you-are-here hidden; selected pin not tied to the sheet card. Fix: price on pins (selected plus top 3 at least), location dot above the sheet, selected pin matches the sheet card. Command: /impeccable clarify
4. [P2] Touch targets and drift. Why: chips 34.8pt, View parking 39.3pt, back row 22.7pt miss 44pt; Covered on Home vanishes on Map; price colour flips. Fix: chips and buttons at least 44pt; one chip set on both screens; one price style; drop the back chevron on the Park root; decide once whether pushed screens show the tab bar. Command: /impeccable polish
5. [P2] Calgary facts are wrong. Why: a local spots "9 Ave SW · On-street" for Stephen Avenue at once; undercuts street-smart. Fix: use a real on-street block from the dataset, with its real zone, as the demo spot. Command: /impeccable clarify

## Persona Red Flags

Casey (one-handed, distracted): search and chips at the top of Home and Map, out of thumb reach; chips 34.8pt; Extend and End stacked 12pt apart; ticking seconds demand attention; no push reminder; no loading or stale state for "8 places".

Jordan (first-timer): "Park" tab, verb or noun?; "Illustrative weekday rate" and "ACTIVE DEMO" read as untrustworthy; progress bar direction unclear (used or left); Start session does not say how long or how much; Home header pin looks tappable and does nothing.

Sam (screen reader, low vision): selected chip and selected tab shown by tint or colour only; warning state colour only; pins need a list alternative; timer needs a spoken label ("54 minutes left") and the bar a value; decorative pins should be hidden from the screen reader; "/ hour" small grey text.

## Minor Observations

- Session: "00:54:36" with seconds forces reading ("54 min left" reads at a glance); teal "A little time back." reads like a link; about 170pt of empty space.
- Welcome shows the brand twice (wordmark and pin); with an icon-only Welcome the wordmark could go.
- Details: "A short walk from Stephen Avenue" on the Stephen Avenue page says nothing; no Directions action.
- Greeting capital: "Good morning, Where to today?"
- Headings render at 700; theme tokens say 600.

## Questions to Consider

- At a red light, does a driver want a list at all, or should Home be the map with prices on pins?
- Why does a Calgary parking app not show the zone number, the one thing you type to pay?
- Ink canvas on 2 of 5 screens in a light-first app: earned, or carried over from the concept art?
