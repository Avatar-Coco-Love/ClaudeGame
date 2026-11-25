# 10 — Orchestration: the standing subagent brief

When a conversation's only instruction is "continue" (D-136, `CLAUDE.md`), the orchestrator checks that no PR is open
against `main`, then hands 3 PRs in a row, one at a time, to a fresh background subagent with the brief below. After each
reply it checks the Pages deploy for that merge commit itself, and stops on a failed merge, smoke failure or failed deploy.
It ends with one line per PR and "Done — say 'continue' in a new conversation". It never writes a prompt for the owner.

## Context budget (D-136)
The owner allows 3 PRs per conversation only while the orchestrating conversation stays under 200k tokens of context.
- Never read a subagent's transcript or output files; use only its final reply.
- Keep every report (subagent replies and your own) to 8 lines or fewer.
- You can't see your token count, so watch for proxies: if the conversation gets summarized / compacted, or subagent
  reports start bloating, run fewer PRs this time and log that change in `docs/06` instead of pushing on.

## Brief (paste as is)
You are doing one PR for the Lumen Core game repo (GitHub: avatar-coco-love/claudegame). Use the GitHub MCP tools
(`mcp__github__*`, load them via ToolSearch) for PR / merge / Actions; there is no `gh` CLI. Work on this session's own
designated branch and push only there. If its previous PR has merged, restart it from the latest main:
`git fetch origin main && git checkout -B <branch> origin/main` (if it holds unmerged commits, keep them by merging).
- Bring the branch up to date with `main` by merging (never force-push, never rebase). If `git status` shows changes you
  didn't make, inspect them before touching anything.
- Read `CLAUDE.md` and `docs/02-Current-Status-and-Next-Step.md` and follow them exactly.
- Do exactly one PR of the session type that is due (Build / Design / Audit), with every record step in `CLAUDE.md`.
  Split big tasks and ship the first slice. If a doc is near its 8 KB cap, start its next part; keep `docs/02` ≤ 60 lines.
- Pass `node tests/smoke.cjs`, printing only FAIL lines and the count. The full smoke takes over 10 minutes: run it in
  the background with output to a file, wait for it to finish, then grep the file. Never merge with a failure and never
  weaken a check.
- Push, open the PR against `main`, merge it yourself, and confirm the Pages deploy run for your merge commit reached
  "success" (poll until it completes; a run can take a minute to appear).
- Don't use the `mcp__memory__*` tools. Keep context lean: grep and read line ranges, and delegate broad exploration to
  subagents if you have an Agent tool.
- End commit messages and PR bodies with the attribution lines your session gives you. Put no model identifier in
  commits, PR text or code.
- Reply in 8 lines or fewer: PR number and merged yes/no, session number and type, what shipped (one line), smoke count,
  deploy status with run id, next step from `docs/02`, any problem.
