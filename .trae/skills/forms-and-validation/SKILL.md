---
name: forms-and-validation
description: Laravel-friendly, accessible form patterns with Blade components and Alpine enhancements; integrate server validation errors and CSRF.
license: MIT
---

# Rules
- Always include `@csrf`.
- Tie `<label for>` to `id` and render `@error('field')` under inputs.
- Provide `aria-invalid` and `aria-describedby` where errors exist.

# Example
```blade
<form method="POST" action="{{ route('profile.update') }}" class="space-y-4">
  @csrf
  <x-forms.input name="name" label="Full name" required />
  <x-forms.input name="email" type="email" label="Email" autocomplete="email" required />
  <x-forms.select name="role" label="Role" :options="$roles" />
  <x-ui.button variant="primary" as="button" type="submit">Save</x-ui.button>
</form>
```
