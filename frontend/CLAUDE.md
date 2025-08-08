# CLAUDE.md

## Code Layout And Usage Development Expectations (CLAUDE)

### 📁 Project Module Imports

To ensure consistency, maintainability, and ease of navigation across the codebase, **always use aliased imports** when referencing internal modules and components.

#### ✅ DO:
Use the `@eristic` alias for any modules under the `src` folder.  
For example:

```ts
// Components
import { MyButtonComponent } from '@eristic/app/components/my-button';

// Services  
import { UserService } from '@eristic/app/services/user.service';

// Environment files
import { environment } from '@eristic/environments/environment';

// Any other src-level files
import { AppConfig } from '@eristic/app/app.config';
```

#### Alias Configuration

The `@eristic` alias is configured in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@eristic/*": ["*"]
    }
  }
}
```

This configuration allows importing from any location within `src/`:
- `@eristic/app/*` → `src/app/*`
- `@eristic/environments/*` → `src/environments/*`
- `@eristic/assets/*` → `src/assets/*` (if exists)

**Benefits:**
- **Consistency** - All internal imports use the same pattern
- **Maintainability** - Easy to refactor folder structures  
- **Readability** - Clear distinction between external and internal modules
- **IDE Support** - Full autocompletion and navigation

Do not use relative paths like `../../`.

#### ❌ DON'T:
```ts
// ❌ Incorrect - relative import
import { MyButtonComponent } from '../../components/my-button';
import { environment } from '../../environments/environment';

// ❌ Incorrect - absolute path without alias
import { MyButtonComponent } from 'src/app/components/my-button';
import { environment } from 'src/environments/environment';
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

---

### 🎨 Icon Standards

**Use SVG-based CSS icon classes** for all UI icons to ensure consistency, maintainability, and zero dependencies.

#### ✅ DO:
```html
<!-- Clean, semantic icon usage -->
<button class="rename-btn">
  <i class="icon-edit"></i>
</button>
<button class="delete-btn">
  <i class="icon-delete"></i>
</button>
```

```css
/* Define icons as CSS classes with embedded SVG */
.icon-edit {
  width: 18px;
  height: 18px;
  background-image: url("data:image/svg+xml,...");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
```

#### Standard Icon Classes:
- `icon-edit` - For rename/edit actions (pencil icon)
- `icon-delete` - For delete actions (trash icon)
- `icon-home` - For home navigation 
- `icon-history` - For topic history
- `icon-forum` - For topics/discussions

#### ✅ Benefits:
- **Zero dependencies** - No external icon libraries required
- **Easy replacement** - Update CSS background-image only
- **Consistent styling** - All icons follow same sizing and positioning
- **Performance** - Inline SVG data URLs, no additional HTTP requests
- **Customizable** - Easy to change colors, sizes, and hover states
- **Maintainable** - Self-contained in component CSS

#### ❌ DON'T:
```html
<!-- ❌ Don't use emoji or unicode characters -->
<button>✏️</button>
<button>×</button>

<!-- ❌ Don't use external icon fonts or libraries -->
<i class="fas fa-edit"></i>
<mat-icon>edit</mat-icon>
```

**Rationale**: CSS-based SVG icons provide the best balance of elegance, performance, and maintainability without external dependencies, ensuring long-term project stability.

---

### 🌙 Theme System Standards

**All components must support both light and dark themes** using CSS custom properties for easy palette modification and consistent theming.

#### ✅ DO: Use CSS Custom Properties

```css
/* Always use theme variables, never hardcoded colors */
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
}

.my-button {
  background-color: var(--color-primary);
  color: white;
}

.my-button:hover {
  background-color: var(--color-primary-hover);
}
```

#### Standard Theme Variables

**Background Colors:**
- `--bg-primary` - Main content backgrounds (cards, forms)
- `--bg-secondary` - Page/sidebar backgrounds 
- `--bg-tertiary` - Button/input backgrounds
- `--bg-hover` - Hover state backgrounds

**Text Colors:**
- `--text-primary` - Main text, headings
- `--text-secondary` - Secondary text, labels
- `--text-muted` - Placeholder text, disabled states

**Border & Action Colors:**
- `--border-primary` - Main borders, dividers
- `--border-secondary` - Subtle borders
- `--border-focus` - Focus states, active borders
- `--color-primary` - Primary action buttons, links
- `--color-danger` - Delete buttons, error states
- `--shadow-sm/md/lg` - Elevation shadows

#### Theme-Aware Icons

```css
/* Define icons for each theme */
.theme-light .my-icon {
  background-image: url("data:image/svg+xml,...stroke='%23007bff'...");
}

.theme-dark .my-icon {
  background-image: url("data:image/svg+xml,...stroke='%234dabf7'...");
}
```

#### ✅ Theme Service Integration

```typescript
// Use ThemeService in components that need theme awareness
import { ThemeService } from '@eristic/services/theme';

@Component({...})
export class MyComponent {
  private themeService = inject(ThemeService);
  
  currentTheme = this.themeService.getTheme();
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
```

#### ❌ DON'T: Hardcode Colors

```css
/* ❌ Never hardcode colors */
.bad-component {
  background: #ffffff;
  color: #333333;
  border: 1px solid #dddddd;
}

/* ❌ Don't use theme-specific selectors for styling */
.theme-dark .my-component {
  background: #1a1a1a; /* Use CSS variables instead */
}
```

#### Color Palette Customization

To modify theme colors, update the CSS custom properties in `src/styles.css`:

```css
/* Easy palette modification */
:root,
.theme-light {
  --color-primary: #007bff;        /* Change primary color */
  --bg-primary: #ffffff;           /* Change backgrounds */
  --text-primary: #212529;         /* Change text colors */
}

.theme-dark {
  --color-primary: #4dabf7;        /* Dark theme primary */
  --bg-primary: #1a1a1a;           /* Dark backgrounds */
  --text-primary: #f8f9fa;         /* Dark text colors */
}
```

#### Benefits

- **Consistent theming** - All components automatically adapt to theme changes
- **Easy customization** - Modify entire color palette by changing CSS variables
- **Performance** - No JavaScript color calculations, pure CSS transitions
- **Accessibility** - Respects system `prefers-color-scheme` preference
- **Maintainability** - Single source of truth for all theme colors

**Rationale**: CSS custom properties provide the most maintainable and performant theming system, allowing easy color palette modifications while ensuring all components remain consistent across light and dark themes.

---

### 📁 File Naming Conventions

**All TypeScript files must use kebab-case with descriptive suffixes** to follow Angular and industry standards.

#### ✅ DO: Use kebab-case + descriptive suffixes

```typescript
// Services
user-auth.service.ts
llm.service.ts
topic-management.service.ts

// Components  
user-profile.component.ts
topic-details.component.ts
mobile-menu-button.component.ts

// Interfaces
llm-provider.interface.ts
user-data.interface.ts

// Guards, Pipes, Directives
auth.guard.ts
currency-format.pipe.ts
highlight.directive.ts

// Models/Types
user.model.ts
api-response.type.ts
```

#### ❌ DON'T: Use other casing conventions

```typescript
// ❌ PascalCase (reserved for class names inside files)
UserAuthService.ts
LLMService.ts

// ❌ camelCase 
userAuthService.ts
llmService.ts

// ❌ snake_case
user_auth_service.ts
llm_service.ts

// ❌ Too generic without suffix
user.ts           // Should be user.service.ts or user.model.ts
auth.ts           // Should be auth.service.ts or auth.guard.ts
```

#### Standard Angular File Suffixes

| File Type | Suffix | Example |
|-----------|--------|---------|
| **Service** | `.service.ts` | `user-auth.service.ts` |
| **Component** | `.component.ts` | `topic-details.component.ts` |
| **Interface** | `.interface.ts` | `api-response.interface.ts` |
| **Model** | `.model.ts` | `user.model.ts` |
| **Guard** | `.guard.ts` | `auth.guard.ts` |
| **Pipe** | `.pipe.ts` | `currency-format.pipe.ts` |
| **Directive** | `.directive.ts` | `highlight.directive.ts` |
| **Resolver** | `.resolver.ts` | `user-data.resolver.ts` |

#### Benefits of Proper Naming

- **Consistency** - Follows Angular CLI conventions
- **Clarity** - File purpose is immediately clear
- **IDE Support** - Better autocomplete and file navigation
- **Team Onboarding** - New developers understand project structure instantly
- **Refactoring** - Easier to find and rename related files

#### File Organization Example

```
src/app/
├── components/
│   ├── user-profile/
│   │   ├── user-profile.component.ts
│   │   ├── user-profile.component.html
│   │   └── user-profile.component.css
│   └── topic-card/
│       ├── topic-card.component.ts
│       ├── topic-card.component.html
│       └── topic-card.component.css
├── services/
│   ├── user-auth.service.ts
│   ├── llm.service.ts
│   └── topic-management.service.ts
├── interfaces/
│   ├── user.interface.ts
│   └── api-response.interface.ts
└── guards/
    └── auth.guard.ts
```

**Rationale**: kebab-case with descriptive suffixes is the Angular community standard, matches Angular CLI output, provides immediate context about file purpose, and ensures consistency across teams and projects.

---

### 🔗 Service Architecture Standards

**Services must follow single responsibility principle and composition patterns** for maintainability and reusability.

#### ✅ DO: Extract common functionality into reusable services

```typescript
// ✅ Generic HTTP service for reusability
@Injectable({ providedIn: 'root' })
export class HttpService {
  async get<T>(url: string): Promise<T> { /* ... */ }
  async post<T, U>(url: string, data: U): Promise<T> { /* ... */ }
  extractApiData<T>(response: HttpResponse<T>): T { /* ... */ }
  buildUrl(base: string, path: string): string { /* ... */ }
}

// ✅ Domain-specific service using HTTP service
@Injectable({ providedIn: 'root' })
export class LLMService {
  private readonly httpService = inject(HttpService);
  
  async generateTopicResponse(topic: string): Promise<LLMResponse> {
    const url = this.httpService.buildUrl(this.apiUrl, '/api/llm/topic');
    const response = await this.httpService.post(url, { topic });
    return this.httpService.extractApiData(response);
  }
}
```

#### ❌ DON'T: Duplicate HTTP logic across services

```typescript
// ❌ Duplicating fetch logic in every service
@Injectable({ providedIn: 'root' })
export class LLMService {
  async generateResponse(topic: string) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    // Repeated error handling logic...
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  async getUsers() {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    // Same repeated error handling...
  }
}
```

#### Service Composition Pattern

```typescript
// Base HTTP service - handles all HTTP concerns
http.service.ts
├── Generic HTTP methods (GET, POST, PUT, DELETE)
├── Error handling utilities
├── URL building helpers
└── Response extraction utilities

// Domain services - use HTTP service for communication
llm.service.ts
├── inject(HttpService)
├── Business logic for LLM operations
├── State management (signals)
└── Domain-specific error handling

user.service.ts
├── inject(HttpService) 
├── User authentication logic
├── User data management
└── User-specific error handling
```

#### Service Responsibilities

| Service Type | Responsibilities | Examples |
|-------------|------------------|----------|
| **HTTP Service** | Network communication, error handling, URL building | `http.service.ts` |
| **Domain Services** | Business logic, state management, domain validation | `llm.service.ts`, `user.service.ts` |
| **Utility Services** | Pure functions, calculations, formatting | `date-utils.service.ts` |
| **State Services** | Global state, caching, persistence | `app-state.service.ts` |

#### Benefits of Service Composition

- **Reusability** - HTTP logic shared across all domain services  
- **Maintainability** - HTTP changes only need updates in one place
- **Testing** - Easy to mock HttpService for unit tests
- **Consistency** - All HTTP calls follow same patterns
- **Type Safety** - Generic types ensure proper request/response typing

#### Dependency Injection Pattern

```typescript
// ✅ Use Angular's inject() function (modern approach)
@Injectable({ providedIn: 'root' })
export class LLMService {
  private readonly httpService = inject(HttpService);
  private readonly configService = inject(ConfigService);
}

// ✅ Also acceptable - constructor injection
@Injectable({ providedIn: 'root' })
export class LLMService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {}
}
```

**Rationale**: Service composition following single responsibility principle creates maintainable, testable, and reusable code that scales well as applications grow. The HTTP service handles all network concerns while domain services focus on business logic.

---

### 📱 Mobile Responsiveness Standards

**All components and pages must be designed mobile-first** to ensure optimal experience on both standard laptop displays and flagship mobile devices.

#### ✅ DO: Mobile-First Approach

```css
/* Start with mobile styles (default) */
.component {
  padding: 16px;
  font-size: 16px; /* Prevents iOS zoom */
  width: 100%;
}

/* Then enhance for larger screens */
@media (min-width: 768px) {
  .component {
    padding: 24px;
    max-width: 600px;
  }
}

@media (min-width: 1024px) {
  .component {
    padding: 32px;
  }
}
```

#### Standard Breakpoints

- **Mobile**: `< 768px` (default, no media query)
- **Tablet**: `768px - 1023px` (`@media (min-width: 768px)`)
- **Desktop**: `1024px - 1439px` (`@media (min-width: 1024px)`)
- **Large Desktop**: `≥ 1440px` (`@media (min-width: 1440px)`)

#### Mobile Touch Targets

```css
/* Minimum 44px touch targets for mobile */
button, .clickable {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
  
  /* Remove iOS default styling */
  -webkit-appearance: none;
  appearance: none;
}

/* Larger touch targets for primary actions */
.primary-button {
  min-height: 52px;
  padding: 16px 20px;
}

/* Input fields - prevent iOS zoom */
input[type="text"], textarea {
  font-size: 16px; /* Prevents zoom on iOS */
  padding: 16px 12px;
  -webkit-appearance: none;
}
```

#### Mobile Navigation Pattern

```html
<!-- Mobile: Overlay navigation -->
<app-mobile-menu-button></app-mobile-menu-button>
<app-side-panel></app-side-panel>

<div class="main-content">
  <!-- Content with mobile padding -->
</div>
```

```css
/* Mobile layout */
.main-content {
  padding-top: 80px; /* Space for mobile menu */
  width: 100%;
}

/* Tablet and up: Sidebar layout */
@media (min-width: 768px) {
  .main-content {
    margin-left: 300px; /* Sidebar width */
    padding-top: 0;
  }
}
```

#### Content Sizing

```css
/* Mobile-friendly content sizing */
.content-card {
  /* Mobile: Full width with minimal padding */
  width: 100%;
  padding: 20px 16px;
  margin: 0;
}

@media (min-width: 480px) {
  .content-card {
    /* Small tablet: Some constraints */
    max-width: 400px;
    padding: 24px;
    margin: 0 auto;
  }
}

@media (min-width: 768px) {
  .content-card {
    /* Tablet and up: More generous sizing */
    max-width: 600px;
    padding: 32px;
  }
}
```

#### Typography Scaling

```css
/* Mobile-first typography */
h1 {
  font-size: 1.75rem; /* Mobile size */
  text-align: center;
  line-height: 1.2;
}

@media (min-width: 768px) {
  h1 {
    font-size: 2.5rem; /* Larger screens */
    text-align: left;
  }
}

/* Body text */
p {
  font-size: 1rem;
  line-height: 1.6;
}

@media (min-width: 768px) {
  p {
    font-size: 1.1rem;
  }
}
```

#### Mobile Component Adaptations

```css
/* Theme toggle: Full button on mobile, icon-only on small screens */
.theme-toggle {
  padding: 12px 16px;
  min-height: 48px;
}

@media (max-width: 480px) {
  .theme-toggle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    justify-content: center;
  }
  
  .theme-label {
    display: none; /* Hide text on very small screens */
  }
}
```

#### ❌ DON'T: Desktop-First Design

```css
/* ❌ Don't start with desktop styles */
.bad-component {
  width: 1200px; /* Too wide for mobile */
  padding: 40px; /* Too much padding for small screens */
}

@media (max-width: 768px) {
  .bad-component {
    width: 100%; /* Retrofitting mobile */
    padding: 10px;
  }
}

/* ❌ Don't use fixed pixel breakpoints without strategy */
@media (max-width: 599px) { /* Random breakpoint */
  /* Inconsistent with standard breakpoints */
}
```

#### Testing Targets

**Standard Laptop Displays:**
- 1366x768 (most common)
- 1440x900 
- 1920x1080

**Flagship Mobile Devices:**
- iPhone 14/15 (390x844)
- Samsung Galaxy S24 (360x800)
- Google Pixel 8 (412x915)

#### Mobile Performance

```css
/* Optimize animations for mobile */
.mobile-animation {
  /* Use transform and opacity for smooth animations */
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Avoid expensive properties on mobile */
@media (max-width: 768px) {
  .expensive-effect {
    /* Remove heavy box-shadows, filters, etc. */
    box-shadow: none;
  }
}
```

#### Benefits

- **Better UX** - Optimized for touch interactions and small screens
- **Performance** - Mobile-first reduces unnecessary CSS for mobile users
- **Accessibility** - Larger touch targets and readable text sizes
- **Future-proof** - Works well as devices continue to vary in size
- **SEO** - Google's mobile-first indexing prioritizes mobile-optimized sites

**Rationale**: Mobile-first responsive design ensures the best user experience across all device types, with touch-friendly interactions and optimal performance for mobile users who represent the majority of web traffic.