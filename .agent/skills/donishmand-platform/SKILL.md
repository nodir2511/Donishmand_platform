---
name: donishmand-platform
description: Core principles and coding standards for the Donishmand Platform (Dark Gaming UI).
---

# Donishmand Platform Development Guidelines

This skill defines the technical and aesthetic standards for the Donishmand Platform. All future updates must adhere to these principles.

## 1. Aesthetic Identity (Dark Gaming UI)
The platform follows a premium "Gaming/Cyberpunk" educational aesthetic.

- **Color Palette**:
  - Background: `#0B0B15` (Deep Void)
  - Cards: `#151525` (Dark Navy with 60% opacity)
  - Primary Accent: `#6C5DD3` (Vibrant Purple)
  - Secondary Accent: `#00E0FF` (Cyborg Cyan)
  - Contrast Accent: `#FF49DB` (Neon Pink)
  - Highlight: `#FFD700` (Gold)
- **Visual Effects**:
  - **Glassmorphism**: Use `backdrop-blur-xl` and `bg-white/5` for panels.
  - **Glows**: Interactive elements should have subtle outer glows (`shadow-gaming-primary/20`).
  - **Borders**: Thin, semi-transparent borders (`border-white/5`) for a sleek look.
- **Typography**: Always use the **Outfit** font for headings and **Inter** for body text.

## 2. Technical Architecture
- **Framework**: React (Vite-based).
- **Styling**: Tailwind CSS (Utility-first). Use custom theme tokens from `tailwind.config.js`.
- **File Structure**:
  - `/src/components/layout`: Global layout parts (Navbar, Footer, CourseLayout).
  - `/src/components/features`: Feature-specific logic (Cards, Selectors).
  - `/src/components/sections`: Large page blocks (Hero, Grids).
  - `/src/components/pages`: Full page components (LessonPage, CreatorPage).
  - `/src/components/creator`: Content editor components (VideoEditor, TestEditor, etc.).
  - `/src/components/viewer`: Content viewer components (SlidesViewer, TestViewer).
  - `/src/services`: API and utility services (translationService).
  - `/src/constants`: Global data and translations (`data.jsx`).
  - `/src/utils`: Helper functions (syllabusHelpers).
- **JSX Extension**: All files containing JSX **must** use the `.jsx` extension to avoid Vite parsing errors.

## 3. Localization Strategy
- All UI text must be stored in `src/constants/data.jsx`.
- Supports `tj` (Tajik) and `ru` (Russian).
- Use the `t` object passed through props for dynamic text switching.
- **Auto-Translation**: Use `translationService.js` for RU→TJ translation:
  ```javascript
  import { translateText } from '../../services/translationService';
  
  const translated = await translateText(text, 'ru', 'tj');
  ```
- Service uses Google Translate API with dictionary fallback for educational terms.

## 4. Interaction Design
- **Animations**: Use `animate-fade-in-up` for new content and `animate-float` or `animate-pulse-slow` for decorative background elements.
- **Micro-interactions**: Every button must have a scale-down effect on active state (`active:scale-95`) and a smooth transition (`transition-all duration-300`).
- **Responsive**: Mobile-first approach. Use horizontal scrolling for tabs/categories on mobile.
- **Drag-and-Drop**: Use `@dnd-kit` library for sortable lists:
  ```javascript
  import { DndContext, closestCenter } from '@dnd-kit/core';
  import { SortableContext, useSortable } from '@dnd-kit/sortable';
  ```

## 5. Content Editor Patterns
When creating content editors for dual-language input:
- Always include RU and TJ input fields
- Add Sparkles button for auto-translation with loading indicator:
  ```jsx
  <button onClick={handleTranslate} disabled={translating}>
    {translating ? <Loader2 className="animate-spin" /> : <Sparkles />}
  </button>
  ```
- Use async/await pattern with try/finally for translation state

## 6. Test Question Types
The platform supports 3 test question types:
1. **multiple_choice**: 4 options (A, B, C, D) with one correct answer
2. **matching**: Left column (A-D) → Right column (1-5) matching
3. **numeric**: Up to 4 digit input boxes with optional unit (м, см, кг, °C, etc.)

## 7. Progress Tracking
Use localStorage for tracking student progress:
```javascript
const getProgressKey = (lessonId, type) => `progress_${lessonId}_${type}`;
localStorage.setItem(getProgressKey(lessonId, 'video'), 'true');
```
Types: `video`, `text`, `slides`, `test_result`

## 8. Modal Components Pattern
Fullscreen modals should:
- Use `fixed inset-0 z-50` positioning
- Include `bg-black/80 backdrop-blur-sm` overlay
- Have close button in header
- Support keyboard navigation (ESC to close)
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
  <div className="w-full max-w-2xl bg-gaming-card/95 rounded-3xl border border-white/10">
    {/* Content */}
  </div>
</div>
```

## 9. Language and Documentation Policy
- **Implementation Plans**: Always provide implementation plans, design documents, and explanations in Russian.
- **Code Comments**: All future comments within the code files must be written in Russian to ensure consistency for the development team.
- **Task Tracking**: Maintain `task.md`, `walkthrough.md`, and other development artifacts in Russian.
- **Change Log**: Documentation updates (especially `walkthrough.md`) must written in **Russian** and include the **date** of the modification (e.g., `(12.02.2026)`).

## 10. Implementation Plans and Approval
- **Mandatory Planning**: Before starting any non-trivial implementation or refactoring, always create an `implementation_plan.md`.
- **Review Requirement**: The plan must be presented to the USER for review.
- **Explicit Approval**: DO NOT start the implementation phase (EXECUTION) until the USER has explicitly reviewed the plan and given approval to proceed.

