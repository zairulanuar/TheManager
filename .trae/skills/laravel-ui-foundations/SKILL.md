---
name: laravel-ui-foundations
description: Base conventions for building UI in Laravel 12 with Blade + Alpine.js + Tailwind. Use when scaffolding layouts/pages/partials in .blade.php files.
license: MIT
---

# Goals
- Generate **semantic**, **responsive**, and **accessible** server-rendered UIs using Blade templates, enhanced with Alpine.js for interactivity.
- Keep concerns separate: data in controllers, markup in Blade, light behavior in Alpine.

# Conventions
- **Layouts**: Extend `resources/views/layouts/app.blade.php` and set `@section('content')`.
- **Blade Components**: Use `/resources/views/components/**` and invoke via `<x-*>`.
- **Alpine**: Prefer `x-data`, `x-model`, `x-on`, `x-show`, `x-transition` for interactions. Avoid heavy JS and jQuery.
- **Tailwind**: Use utility classes; prefer design tokens (CSS variables) for colors/spacing; ensure dark mode support via `class` strategy.

# Patterns
## Page layout
```blade
@extends('layouts.app')
@section('title', 'Dashboard')

@section('content')
  <div class="space-y-6">
    <x-page-header title="Dashboard" />
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <x-card-stat title="Revenue" :value="$kpi['revenue']" :trend="$kpi['revenue_trend']" />
      <x-card-stat title="Orders" :value="$kpi['orders']" :trend="$kpi['orders_trend']" />
    </div>
  </div>
@endsection
```

# References
- Laravel Blade features (layouts, components, stacks, directives)
- Alpine.js directives for state and events
