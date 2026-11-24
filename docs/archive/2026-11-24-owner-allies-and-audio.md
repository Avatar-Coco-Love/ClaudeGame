# Owner notes (2026-11-24): AI allies idea + audio pack is coming

Two things the owner said in an orchestration conversation (sessions 71–76). Process per `README.md`.

## 1. Idea: smart AI allies that work like the player

Owner's words (paraphrased): an ally you gain access to that **follows the core around and keeps up**, with
**command buttons** such as *defend*, *attack*, *mine*. It must be smart and never fall behind.
The owner asked that this get **real consideration**, and that if it doesn't fit now it be **parked for later**
(a roadmap/Q-xxx entry with what would have to be true), not rejected outright.

Starting notes for the design session (not decisions):
- **Pillars:** an ally must be geometry, not a figure (e.g. a lesser core / satellite orbiting the core).
  **Drift and Surge are equals:** *mine* serves Drift, *defend/attack* serves Surge; both modes need a reason to want it.
  **Small complete systems:** one ally with 2–3 orders done well beats a squad with many shallow orders.
- **Keeping up:** the world is a carved grid. A distance field (BFS) from the core over open cells, refreshed on a
  timer or on cell break, lets an ally path through tunnels; a "catch-up" rule (fast return or a short blink when
  far / stuck) guarantees it never gets stranded. Measure it with a bot over many seeds (strand rate, lag distance).
- **Controls:** phones already carry twin sticks + a ◎⟂♪≡ row with ≥ 44 px targets. Prefer **one order button
  that cycles** (or a small radial) over 3–4 new buttons; desktop gets one rebindable key (S-39 keys).
- **Progression:** which layer grants it (Research? Crafting? a Spire reward?) must not duplicate an existing unlock.
- **Scope:** v1.x is scoped to end after M8 (D-045). If adopted, this is a new milestone or replaces an M8 item;
  decide which, record a D-xxx, and write S-n specs.

## 2. Audio pack: the owner says it is coming

The owner will supply the recorded audio files later ("when I get home"). This bears on **Q-021** (ship M8 / v1.3
without the owner's audio pack?). Record that the owner has confirmed the pack is coming, and weigh that before
deciding to ship M8 without it.
