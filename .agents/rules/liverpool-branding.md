---
trigger: always_on
---

# El Puerto de Liverpool Branding & UI Guidelines

All frontend development and UI components in this repository MUST comply with the corporate design language of **El Puerto de Liverpool**:

1. **Brand Colors**:
   - **Primary Morado (Purple)**: `#7B2D6E` (base), `#5A2050` (dark/plum), `#F6EEF4` (tint).
   - **Accent Naranja (Orange)**: `#F47920` (vibrant base), `#D9610B` (dark/hover), `#FFF3EB` (tint).
   - **Neutrals**: Canvas `#F7F5F6`, Card `#FFFFFF`, Border `#ECE7EA`, Text primary `#241B22`, Text secondary `#6B5F68`.

2. **UI Patterns**:
   - Use Tailwind CSS classes matching these tokens.
   - Use `<button type="button">` with focus rings and hover transitions instead of unstyled `<div>`s.
   - Primary high-impact actions (e.g., "Publicar requisición", "Comparar") should feature Liverpool Orange or Morado according to action hierarchy.
   - Use `lucide-react` icons for consistent, crisp iconography.
   - Ensure responsive layout across mobile, tablet, and desktop screens.
