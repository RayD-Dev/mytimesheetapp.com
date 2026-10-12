---
name: docs-sync
description: Refresh the read-only local copy of the project's Notion docs in docs/notion/ (PRD, HL design, system design, FE and BE design) and rebuild docs/INDEX.md, the one-line-per-item index of requirements, decisions, roadmap and open questions that plans cite. Use when the user asks to sync, refresh or pull the docs, says they've changed or commented on something in Notion, or when ui-e2e needs facts and docs/INDEX.md is more than a week old.
---

# Docs sync

Notion is the master for the product and design docs, because the user gives feedback there as comments. `docs/notion/` is a read-only copy, so sessions can read the docs without fetching them from Notion every time. `docs/INDEX.md` lets a plan cite `FR-14` or an architecture decision without opening a whole doc.

Never edit `docs/notion/` by hand. To change a doc, change it in Notion, then run this skill.

## Steps

1. **Read `docs/notion/sources.json`.** It lists each page's title, file name, Notion URL and the `lastEdited` time seen at the last sync.
2. **Find what changed.** Fetch each page with the Notion fetch tool and compare its `page_last_edited_at` with `lastEdited`. Skip unchanged pages. Ignore the page body for now; the fetch is only to compare edit times.
3. **Copy each changed page with a sub-agent.** Use one implementer (Sonnet) per page, all in one message so they run in parallel. Accuracy matters more than cost here, because plans are built on these files. Each brief says:
   - Fetch `<url>` with the Notion fetch tool. If the result says it's truncated, or lists unknown blocks, fetch those too, or report what's missing.
   - Write `docs/notion/<file>` containing this header, then the page content **verbatim** in Notion's markdown. Don't summarise, reorder, convert tables or drop sections.
     ```
     <!-- Read-only copy of <title>: <url>
          Notion is the master; comment and edit there, then run docs-sync.
          Notion last edited: <page_last_edited_at> · Synced: <today, DD/MM/YYYY> -->
     ```
   - Report back the number of top-level headings, the IDs found (FR-, AD-, Q- and so on), and the file size. No content.
4. **Spot-check each copy.** Compare the agent's heading and ID counts with the fetched page, and read one table. Then update `lastEdited` and `syncedAt` in `sources.json`.
5. **Rebuild `docs/INDEX.md`** if any page changed, with one implementer that reads all of `docs/notion/` and writes:
   - `Synced: <date>` at the top, with each source's last-edited date.
   - One table per kind:
     - functional requirements
     - quality requirements
     - product decisions
     - architecture decisions
     - FE decisions and BE decisions
     - roadmap items by milestone
     - open questions and TBD sections by doc
   - Columns: **ID** (or a short name if there's no ID), **summary** in at most about 20 words using the doc's own terms, and **where** (`<file> §<section>`).
   - Nothing interpreted or added; if something is ambiguous, quote it.
   - A final "Conflicts" table for points where two docs disagree, or one doc contradicts itself. Quote both sides with their locations. Never resolve them in the index; they go to the user.
6. **Report** which pages changed, and the `git diff --stat docs/`. If the index gained or lost requirements or decisions, name them. Plans in progress may need to know.

## Adding a page

Add an entry to `sources.json` with a new file name and `"lastEdited": null`, then run the steps above.
