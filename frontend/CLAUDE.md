# CLAUDE.md

## Code Layout And Usage Development Expectations (CLAUDE)

### 📁 Project Module Imports

To ensure consistency, maintainability, and ease of navigation across the codebase, **always use aliased imports** when referencing internal modules and components.

#### ✅ DO:
Use the `@eristic` alias for any modules under the `src/app` folder.  
For example, to import a component from `src/app/components/my-button`, write:

```ts
import { MyButtonComponent } from '@eristic/components/my-button';
```

This applies to any custom module inside `src/app`

Aliases are configured in the `tsconfig.json` or `tsconfig.base.json` under the `paths` field. Do not use relative paths like `../../`.

#### ❌ DON'T:
```ts
// ❌ Incorrect - relative import
import { MyButtonComponent } from '../../components/my-button';

// ❌ Incorrect - absolute path without alias
import { MyButtonComponent } from 'src/app/components/my-button';
```

---

### 📦 Import Sorting

All import statements **must be sorted alphabetically** and **grouped logically** with **a blank line** between groups.

#### Grouping Order

1. **External libraries (e.g. `@angular`, `rxjs`, `lodash`, etc.)**
2. **Aliased project imports (e.g. `@eristic/...`)**
3. **Style or asset imports (e.g. `./styles.scss`)**

#### Example:

```ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '@eristic/components/button';
import { FormValidatorService } from '@eristic/services/form-validator';
```

#### Notes:
- Alphabetical order should be **within each group**.
- Group separation improves readability and maintains clarity as the project grows.