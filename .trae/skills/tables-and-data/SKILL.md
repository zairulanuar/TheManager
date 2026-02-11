---
name: tables-and-data
description: Accessible data tables with server pagination/sorting; Alpine for small client-side filters; responsive patterns for mobile.
license: MIT
---

# Requirements
- Use semantic table elements with `<caption class="sr-only">`.
- Use `<th scope="col">` and, for row headers, `<th scope="row">`.
- Make actions reachable by keyboard; avoid tiny hit targets.

# Blueprint
```blade
<table class="w-full border-separate border-spacing-0">
  <caption class="sr-only">Inventory table</caption>
  <thead class="text-xs text-muted-foreground">
    <tr>
      <th scope="col" class="px-3 py-2 text-left">Item</th>
      <th scope="col" class="px-3 py-2 text-left">Stock</th>
      <th scope="col" class="px-3 py-2 text-left">Price</th>
      <th scope="col" class="px-3 py-2"></th>
    </tr>
  </thead>
  <tbody class="divide-y">
    @foreach($items as $item)
    <tr>
      <th scope="row" class="px-3 py-3">{{ $item->name }}</th>
      <td class="px-3 py-3 tabular-nums">{{ $item->stock }}</td>
      <td class="px-3 py-3 tabular-nums">{{ number_format($item->price, 2) }}</td>
      <td class="px-3 py-3 text-right">
        <x-ui.button as="a" href="{{ route('items.edit', $item) }}" variant="ghost">Edit</x-ui.button>
      </td>
    </tr>
    @endforeach
  </tbody>
</table>

<x-pagination :paginator="$items" />
```
