---
name: theming-and-tokens
description: Use Tailwind + CSS variables to mirror shadcn token names (primary, secondary, accent, muted; foreground/background) with dark mode via class strategy.
license: MIT
---

# Tailwind config (concept)
- Use `darkMode: 'class'`.
- Expose CSS variables in `:root` and `.dark`.
- Map Tailwind colors to `hsl(var(--primary))` etc.

# Base CSS
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --muted: 210 20% 96%;
  --muted-foreground: 215 16% 47%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --ring: 222 84% 5%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
}
.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
}
```

# Usage
- Components should compose classes like `bg-background text-foreground`, `bg-primary text-primary-foreground`, etc.
