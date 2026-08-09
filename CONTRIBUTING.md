# Contributing to Box Office Inc - Movie Studio Simulator

First off, thank you for considering contributing to **Box Office Inc - Movie Studio Simulator**! 🎉

Your contributions help make Box Office Inc - Movie Studio Simulator a better movie studio management and simulation experience for everyone.

This repository is an official participating project in:

- 🌟 **ECSOC 2026**
- 🚀 **ELUSOC 2026**

Please read the following guidelines carefully before contributing.

---

# Open Source Program Guidelines

## 🌟 ECSOC 2026

- If you create a new issue related to ECSOC, please add the **`ECSOC2026`** label.
- When opening your Pull Request, mention that it is an **ECSOC 2026** contribution and ensure the **`ECSOC2026`** label is applied if available.
- During the review process, a project admin will apply the **`ECSoC26`** label **before the Pull Request is merged**. This ensures the ECSOC Sentinel bot can automatically detect and process your merged contribution without delays.

---

# Contribution Workflow

We follow a structured workflow to maintain high code quality.

## 1. Find an Issue

Browse the **Issues** section and choose an open issue.

Please read the issue carefully before requesting assignment.

---

## 2. Request Assignment

Comment on the issue requesting assignment.

Wait until a project admin assigns the issue before starting work.

Contributions made without assignment may not be accepted.

---

## 3. Fork & Clone the Repository

```bash
git clone https://github.com/SRV30/Box_Office_Inc-Movie_Sim.git
cd Box_Office_Inc-Movie_Sim
```

---

## 4. Checkout the Correct Branch

### ECSOC Contributors

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

---

## 5. Development

While implementing your solution:

- Follow the existing project structure.
- Keep your changes limited to the assigned issue.
- Write clean, readable, and maintainable code.
- Avoid unnecessary refactoring unrelated to the issue.

---

## 6. Test Your Changes

Before creating a Pull Request, make sure:

- The application builds successfully.
- Existing functionality is not broken.
- New features work correctly.
- No unnecessary warnings or console errors are introduced.

---

## 7. Commit Your Changes

Use meaningful commit messages following the Conventional Commits format.

Examples:

```text
feat: add actor search functionality
fix: resolve movie production crash
docs: update installation guide
refactor: optimize weekly simulation engine
```

---

## 8. Open a Pull Request

Your PR should:

- Link the related issue using:

```text
Closes #IssueNumber
```

- Include a clear description of the changes.
- Attach screenshots or screen recordings for UI changes.
- Mention whether your contribution is for **ECSOC 2026** or **ELUSOC 2026**.
- If you created the related issue, ensure it has the appropriate program label (`ECSOC2026` or `ELUSOC2026`).
- Request that the corresponding program label be applied to your Pull Request if it has not already been added.

---

## 9. Code Review

Project admins will review your Pull Request.

Please address review comments promptly and update your PR if requested.

For ECSOC contributions, project admins will apply the **`ECSoC26`** label during the review process **before the Pull Request is merged** to ensure successful processing by the ECSOC Sentinel automation.

---

## 10. Merge

Once approved, a project admin will merge your Pull Request.

For **ECSOC 2026** contributions, the **`ECSoC26`** label will be added by a project admin **during the review phase before merging**. This allows the ECSOC Sentinel bot to automatically detect, evaluate, and score the Pull Request immediately after it is merged.

---

# Coding Standards

## JavaScript

- Use modern ES6+ syntax.
- Follow the project's ESLint and Prettier configuration.

## React

- Use functional components.
- Prefer React Hooks.
- Keep components modular and reusable.
- Use Redux Toolkit `createSlice` for state management.
- Place API calls in custom hooks or service modules, not in components.

## Naming Conventions

- Variables → `camelCase`
- Functions → `camelCase`
- React Components → `PascalCase`
- Constants → `UPPER_SNAKE_CASE`
- File names match exported component names (e.g., `ActorCard.jsx` exports `ActorCard`).
- Slice files are named with camelCase (`authSlice.js`, `movieSlice.js`).

## Styling

- Use TailwindCSS utility classes. Avoid inline styles for layout.
- Use CSS variables (via `ThemeContext`) for theme-aware colors.
- Follow existing spacing patterns (p-4, p-6, gap-4, rounded-2xl, etc.).
- Responsive design: test on mobile (375px) and desktop (1440px).

## Testing

- Backend: Node.js built-in test runner, files in `backend/tests/`.
- Run `npm test` in the `backend/` directory.
- Frontend tests should be added in `frontend/src/__tests__/` using Vitest.

## Comments

Write comments only where necessary to explain complex logic. Avoid redundant comments that restate the code.

---

# Pull Request Checklist

Before submitting your Pull Request, ensure that:

- [ ] I have been assigned this issue.
- [ ] My PR targets the correct branch.
- [ ] My code builds successfully.
- [ ] I tested my changes locally.
- [ ] I followed the project's coding standards.
- [ ] I linked the related issue.
- [ ] I attached screenshots for UI changes (if applicable).
- [ ] I indicated whether this contribution is for ECSOC 2026 or ELUSOC 2026.
- [ ] The appropriate program label has been requested or applied.

---

# Duplicate Issue Prevention

Before creating a new issue, please search the existing issues (both open and closed).

Duplicate issues may be closed.

If you create a new issue, please apply the appropriate program label:

- **`ECSOC2026`** for ECSOC contributions.
- **`ELUSOC2026`** for ELUSOC contributions.

---

# Merge Conflict Resolution

If your branch becomes outdated:

### ECSOC

```bash
git checkout main
git pull origin main
```

### ELUSOC

```bash
git checkout main
git pull origin main
```

Resolve conflicts locally, test your changes again, and push the updated branch.

---

# Getting Started

Please refer to **README.md** for installation instructions and project setup.

---

# Need Help?

If you have any questions:

- Open a GitHub Discussion.
- Ask your question in the issue comments.
- Reach out to the project admins.

We're happy to help!

---

Thank you for contributing to **Box Office Inc - Movie Studio Simulator** and being part of **ECSOC 2026** and **ELUSOC 2026**.

Happy Coding! 🚀