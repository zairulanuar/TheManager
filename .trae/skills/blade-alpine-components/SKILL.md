---
name: blade-alpine-components
description: Generate reusable Blade components with Alpine.js behavior (tabs, dropdowns, accordions, tooltips) using Tailwind utilities and a11y patterns.
license: MIT
---

# Guidelines
- Every interactive control must be reachable via keyboard (Tab) and operable with Enter/Space.
- Provide `aria-*` attributes, visible focus (use `focus-visible`) and ESC to close on overlays.

# Component Blueprints

## Button
- Variants: primary, secondary, ghost, destructive, link
- Sizes: sm, md, lg, icon

```blade
{{-- resources/views/components/ui/button.blade.php --}}
@props(['variant' => 'primary', 'size' => 'md', 'as' => 'button'])
@php
  $base = 'inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  $sizes = [
    'sm' => 'h-8 px-3 text-sm',
    'md' => 'h-10 px-4 text-sm',
    'lg' => 'h-11 px-5 text-base',
    'icon' => 'h-10 w-10'
  ];
  $variants = [
    'primary' => 'bg-primary text-primary-foreground hover:bg-primary/90',
    'secondary' => 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    'ghost' => 'hover:bg-accent hover:text-accent-foreground',
    'destructive' => 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    'link' => 'text-primary underline-offset-4 hover:underline'
  ];
@endphp

<{{ $as }} {{ $attributes->class("$base {$sizes[$size]} {$variants[$variant]}") }}>
  {{ $slot }}
</{{ $as }}>
```

## Tabs (Alpine)
```blade
<div x-data="{ tab: 'overview' }" class="w-full">
  <div role="tablist" class="flex gap-2 border-b">
    <button :class="tab==='overview' && 'border-b-2 border-primary'"
            @click="tab='overview'" role="tab" aria-selected="true"
            class="px-3 py-2">Overview</button>
    <button :class="tab==='reports' && 'border-b-2 border-primary'"
            @click="tab='reports'" role="tab" aria-selected="false"
            class="px-3 py-2">Reports</button>
  </div>
  <section x-show="tab==='overview'" role="tabpanel" class="py-4">...</section>
  <section x-show="tab==='reports'" role="tabpanel" class="py-4">...</section>
</div>
```
