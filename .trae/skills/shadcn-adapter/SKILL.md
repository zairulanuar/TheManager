---
name: shadcn-adapter
description: When asked to use "shadcn", prefer Blade/Alpine equivalents. If a Blade shadcn port exists in vendor, use those components; otherwise generate Blade components that follow shadcn tokens + anatomy.
license: MIT
---

# Strategy
- Detect whether a Blade shadcn package exists (e.g. views under `resources/views/vendor/*shadcn*` or `vendor/**/shadcn-*`).
- If present, import like `<x-shadcn::button variant="primary">…</x-shadcn::button>`.
- If not present, output `<x-ui.button>` using the same variants/sizes and token names.

# Notes
- Official shadcn/ui docs for Laravel assume Inertia + React; in Blade + Alpine use ports or replicate style tokens.
- Keep ARIA and roles aligned with dialog/menu/tab patterns.
