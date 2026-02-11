---
name: dialogs-and-overlays
description: Accessible Alpine.js modals, drawers, and popovers with focus trapping and ESC to close; align with shadcn dialog styling.
license: MIT
---

# Modal (Alpine)
- Add `role="dialog"`, `aria-modal="true"`, labelled by a heading id.
- Trap focus on open; restore on close.

```blade
<div x-data="{ open: false }" class="relative">
  <x-ui.button variant="primary" @click="open = true">New Record</x-ui.button>

  <div x-show="open" x-transition.opacity
       @keydown.escape.window="open = false"
       class="fixed inset-0 z-50 grid place-items-center bg-black/50">
    <div x-trap.noscroll="open"
         class="w-full max-w-lg rounded-lg bg-card p-6 text-card-foreground shadow-lg"
         role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <h2 id="dlg-title" class="text-lg font-semibold">Create record</h2>
      <p class="mt-2 text-sm text-muted-foreground">Fill in details…</p>
      <div class="mt-6 flex justify-end gap-2">
        <x-ui.button variant="secondary" @click="open = false">Cancel</x-ui.button>
        <x-ui.button variant="primary">Save</x-ui.button>
      </div>
    </div>
  </div>
</div>
```
