# Owner request: a Lumen Core card on the main Projects page

From the owner, 2026-11-24 (passed on by a Claude session that edited the Projects page).

The owner wants Lumen Core listed on their main Projects page,
https://avatar-coco-love.github.io/ (repo `Avatar-Coco-Love/avatar-coco-love.github.io`, file `index.html`).
**You decide how the card looks and what it says.** The owner wants that choice to be yours.

What's already done on that page:
- Nexus Drift was removed for now.
- Cards are in the order the owner asked for: **Gloamdeep, Emergent Arcade, Foldwork, Lumen Core, Animal Mail Route.**
- An HTML comment marks the empty Lumen Core slot between Foldwork and Animal Mail Route.

What to do:
1. Add the Lumen Core card in that slot, replacing the comment. Link to https://avatar-coco-love.github.io/ClaudeGame/.
   Follow the page's existing pattern: an `<li class="card">` with a 1200×630 image, `<h2><a>`, one-line `<p>`, and a `.go` label.
   The page's own rules are in comments next to its CSS (only the title is a link, no hover border, works at 320 px, light and dark themes).
   A card can have its own look, as Gloamdeep's `.card.lit` does. Keep it true to the pillars: neon geometry on dark.
2. The image: Lumen Core has no share image yet. Making one (a real frame of the game, 1200×630) is a fine part of this task.
   Put it either in this repo (served from the live site) or next to `index.html` in the Projects repo, as `gloamdeep.png` is.
   Consider adding it as the game's own `og:image` too.
3. Wording: say what the game is in one plain sentence, and be honest about its state (in progress, a new version often).
   Update that page's `description` / `og:description` meta and its README card list to include Lumen Core.
4. Ship it as a PR on the Projects repo (self-merge is fine, as earlier Gloamdeep sessions did there), screenshot the card
   at phone width and desktop, and record the decision here as a D-xxx, plus a `docs/09` entry.
   If this session can't reach the Projects repo, write the finished card HTML and image into `docs/` here, note it in `docs/02`,
   and say so in the PR so the owner can pass it on.

Then archive this file in `docs/archive/` as the inbox README says.
