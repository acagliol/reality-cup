# Reality Cup

*Price the probability. Beat the machines. Find the fake.*

Reality Cup is a deepfake-detection game we built where guessing "real" or "fake" isn't
enough. For every image you have to say *how sure* you are — something like "there's an
82% chance this one is fake" — and you're scored on how well you actually price that
uncertainty. Be confident and right and you clean up. Be confident and wrong and it
hurts. Hedge at 50% on everything and you go nowhere.

The twist is that you're not just playing against the room. Each image is also graded by
AI detection models, so the real question is whether people can still read a fake better
than the machines when the scoring rewards calibration instead of vibes. Everyone in the
room prices the same image, the truth gets revealed, and you watch where you landed
against the crowd, the models, and reality.


## Ramp Builders' Cup

We built Reality Cup at the Ramp Builders' Cup in NYC on July 18, 2026, a hackathon
co-sponsored by Cursor and Codex. We had four hours to ship it.

It ended up as a **finalist in the Best Game track**, and we got to present it live in
the finalist demos. We also entered the **Best Use of Codex** track — we leaned on Codex
heavily to design the scoring, build the game loop, and iterate fast under the clock. At
one point during the science-fair demos a **Cursor engineer came by our table** and we
walked them through a full game, which was a highlight of the day. We also came away with
some **Ramp and Cursor merch**, which was a fun bonus.

## Where This Could Go

Right now Reality Cup is a game, but there's a bigger idea underneath it. Every time
someone prices an image, they're generating a signal about how humans read that
particular fake — which ones fool people, which ones don't, and how confident people are
when they get it right or wrong.

The natural next step is to let people **upload their own images** and feed them into the
dataset. Over time that turns into a growing, human-labeled collection of real and fake
media, complete with per-image analytics: crowd calibration, where the AI detectors
agreed or disagreed with people, and which fakes were the hardest to catch. That's
genuinely valuable data.

Longer term, we think this could be **sponsored by companies and labs** who want to
**train better deepfake-detection models** — the human-vs-machine calibration data is
exactly the kind of signal that helps models get sharper at spotting fakes. There's a
real path to eventually **licensing that dataset** to the people building detection tools.

None of that is built yet — these are potential future goals. But the north star is
simple: make a game people actually want to play, and in the process **build shared
knowledge about deepfakes and help society get better at telling what's real**, all while
having fun competing over it.
