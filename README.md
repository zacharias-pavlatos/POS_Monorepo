
### Stack overview

Below is an overview of all the components in the stack:

```
apps
  ├─ web
  |   ├─ nextjs
  |   ├─ tanstack query
  |   ├─ react hook form
  |   └─ tailwindcss
  ├─ server
  |   └─ hono (wrapper for api & auth)
packages
  ├─ api
  |   └─ orpc with zod
  ├─ auth
  |   └─ better-auth
  ├─ db
  |   └─ drizzle-orm (postgres database)
  ├─ ui
  |   ├─ tailwindcss
  |   └─ shadcn & radix ui
tools
  ├─ eslint
  ├─ prettier
  ├─ tailwind
  └─ typescript
```

Bussnes decisions:
- What will happen if a category is deleted? What about products in that category?
- What will happen if a workstation is deleted? What about the categories and products in that workstation? ?
