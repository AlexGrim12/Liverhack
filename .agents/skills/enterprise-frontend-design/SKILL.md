---
name: enterprise-frontend-design
description: >-
  Best practices for crafting high-quality, modern, accessible enterprise frontend interfaces
  with Next.js, React, and Tailwind CSS. Use when building dashboards, filter panels, data comparison tables,
  forms, and modal workflows.
---

# Enterprise Frontend Design Guide

This skill provides patterns and architectural best practices for building responsive, accessible, and elegant enterprise applications in Next.js and Tailwind CSS.

---

## 1. Principles of Enterprise UI

1. **Information Density with Breathing Room**:
   - Provide clear hierarchy without cluttering.
   - Use whitespace (`gap-4`, `p-6`) intentionally to separate logical groups.
   - Use cards (`bg-white rounded-2xl border shadow-sm`) with subtle hover elevation (`hover:shadow-md transition-shadow`).

2. **Semantic Elements & Accessibility (a11y)**:
   - Use `<button type="button">` with visible focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2`).
   - Group form fields with `<label>` tags and provide helpful helper text.
   - Never rely exclusively on color to convey state (e.g. combine color dots with clear status labels).

3. **Micro-interactions & State Feedback**:
   - Interactive elements must provide visual feedback on hover, active/tap, and disabled states.
   - Smooth transitions (`transition-all duration-150`).
   - Modals must feature backdrop blur, close triggers, and prevent background scrolling.

4. **Iconography**:
   - Use consistent icon families (`lucide-react`) with consistent stroke widths (`strokeWidth={1.75}` or `2`).
   - Pair icons with text labels whenever possible for clarity.

---

## 2. Common Enterprise Components

### 2.1 Metric & KPI Cards
- Top stat with bold numerical value (`text-2xl font-extrabold`).
- Icon badge in top right with soft background.
- Contextual comparison or status trend below.

### 2.2 Data Filter Drawers & Sidebars
- Clear categories with counters.
- Sticky or neatly aligned filter controls (sliders, multi-select checkboxes).
- "Clear all" or "Reset filters" option for quick reset.

### 2.3 Comparison Matrices
- Fixed first column or clear column headers.
- Visual emphasis on differentiators (tags, badges, scores).
- Direct call-to-action on candidate columns.
