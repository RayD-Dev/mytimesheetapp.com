---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Read the pinned guidelines in `command.md` next to this file
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Use the pinned copy in `command.md` next to this file; don't fetch the rules from the web. This project pins its upstream skills and updates them through `.claude/skills/_upstream/` after the diff has been reviewed. `build-rules.md` next to it holds the same guidelines written as build rules (MUST/SHOULD/NEVER).

## Usage

When a user provides a file or pattern argument:
1. Read the guidelines in `command.md`
2. Read the specified files
3. Apply all rules from the guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
