---
name: a11y-ux-audit
description: Run a quick audit on generated Blade/Alpine UI for accessibility, responsiveness, and UX fit; reference general web design guidelines.
license: MIT
---

# Checklist (apply when asked to "review/audit")
- Semantics: headings in order, lists/tables correct.
- Labels: all inputs labelled; errors announced (`aria-describedby`).
- Keyboard: focusable, focus ring visible, ESC to close overlays.
- Motion: respect `prefers-reduced-motion`.
- Responsive: small screens first; test at 320px / 768px / 1024px.
- Performance: avoid layout thrash; preload critical fonts; lazy-load heavy images.

# How to respond
- Report issues and propose exact Blade/Alpine diffs to fix them.
