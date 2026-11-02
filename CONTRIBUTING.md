# Contributing to Box Office Inc - Movie Studio Simulator

Thank you for helping improve **Box Office Inc - Movie Studio Simulator**. Contributions should be useful, focused, tested, and respectful of the project's existing architecture.

## Programs

This repository participates in ECSOC 2026 and ELUSOC 2026 and has been selected for Nexus Spring of Code (NSoC) Winter Edition 2026.

- **NSoC Project Admin / Project Kernel:** Sahil Raj Verma
- **NSoC website:** https://www.nsoc.in/

NSoC describes a 45-day program focused on meaningful issues, reviewed pull requests, and production-useful contributions. For NSoC work in this repository, add the `nsoc26` label to the issue and pull request, and apply exactly one task-level label: `level1`, `level2`, or `level3`. The `[NSoC_2026]` issue-title prefix may be used to make NSoC tasks easy to identify, but it does not replace the required labels. Follow the current [official NSoC guidance](https://www.nsoc.in/) for registration, eligibility, review, and contribution tracking. Do not promise points or recognition for a contribution; the organizers determine what qualifies.

## Contribution workflow

### 1. Find or discuss an issue
- Search open and closed issues and pull requests before creating a new issue.
- Choose an issue that describes a real bug, improvement, test, or documentation need.
- Ask for assignment or maintainer approval before starting substantial work.
- Clarify the expected outcome if the issue is ambiguous.

### 2. Fork and clone
```bash
git clone https://github.com/SRV30/Box_Office_Inc-Movie_Sim.git
cd Box_Office_Inc-Movie_Sim
```

Create a branch for your change:
```bash
git checkout main
git pull origin main
git checkout -b <type>/<short-description>
```

Examples: `fix/movie-release-validation`, `feat/talent-search`, `docs/local-setup`.

### 3. Develop responsibly
- Keep the change focused on the issue.
- Follow the existing code organization and naming conventions.
- Avoid unrelated refactors and generated files.
- Never commit credentials, tokens, private keys, production data, or local `.env` files.
- Add or update tests for behavior changes when feasible.
- Update documentation when commands, environment variables, APIs, or user-facing behavior change.

### 4. Test your change
Run the relevant tests, lint checks, and build commands defined by the frontend and backend package files. In the PR, list the exact commands run and their outcomes. If a check cannot be run, explain why rather than implying it passed.

For UI changes, check mobile and desktop layouts and attach screenshots when useful.

### 5. Commit with a clear message
Use a concise, descriptive commit message. Examples:
```text
feat: add actor search
fix: validate movie release state
docs: clarify local environment setup
test: cover weekly simulation transitions
```

### 6. Open a pull request
A good PR should:
- Explain the problem and the proposed solution.
- Link the related issue (for example, `Closes #123`).
- Describe the tests and checks actually run.
- Include screenshots or recordings for significant UI changes.
- Mention any migration, configuration, or environment-variable changes.
- Be limited to the assigned or agreed scope.

Request review from the project maintainers and respond constructively to feedback. Do not merge your own contribution unless you have the required permission and approval under the project's workflow.

## Program-specific instructions

### NSoC Winter Edition 2026
- Choose a meaningful, actionable issue that matches your skills and discuss unclear scope with the Project Kernel before implementation.
- Prefer one issue per pull request. Explain the problem, the change, and the evidence that it works.
- Avoid duplicate, spam, placeholder, or low-effort contributions intended only to increase activity.
- Add the `nsoc26` label to each NSoC issue and pull request, and use exactly one of `level1`, `level2`, or `level3` to reflect task complexity. Keep the `[NSoC_2026]` issue-title prefix when used by the project; it does not replace labels.
- Submit a focused pull request and respond to review feedback. A pull request is not considered shipped merely because it was opened; maintainers review it and decide whether to merge.
- Follow the current official NSoC guidance for registration, eligibility, review, deadlines, and contribution tracking. Do not promise points or recognition; the organizers determine what qualifies.

### ECSOC 2026
- For ECSOC-related issues, use the `ECSOC2026` label when applicable.
- Mention the program in the PR when the contribution is for ECSOC.
- Project admins apply the `ECSoC26` label during review before merging when required by the ECSOC Sentinel workflow.

### ELUSOC 2026
- Identify ELUSOC-related contributions clearly in the issue or PR and follow the program-specific instructions provided by its organizers.

## Project coding conventions

### JavaScript
- Use modern JavaScript consistent with the existing codebase.
- Follow the repository's ESLint and Prettier configuration where configured.

### React
- Prefer functional components and hooks where consistent with existing patterns.
- Keep components modular and reusable.
- Keep API calls in the project's existing API/service layers rather than introducing new patterns without a clear reason.
- Use the styling and state-management conventions already established in the codebase.

### Naming
- Variables and functions: `camelCase`
- React components: `PascalCase`
- Constants: follow the surrounding module's convention.

## Issues and collaboration
- Search for duplicates before opening an issue.
- Include clear reproduction steps for bugs, expected versus actual behavior, and relevant logs with secrets removed.
- Be respectful in issue discussions and code reviews.
- Do not submit spam, duplicate issues, or unrelated changes solely to increase contribution counts.

## Pull request checklist

- [ ] The change addresses the linked issue or agreed task.
- [ ] The change is focused and follows the existing project structure.
- [ ] Relevant tests/build/lint checks were run, and results are reported accurately.
- [ ] Documentation and environment examples are updated when needed.
- [ ] No secrets or local environment files are included, and `.gitignore` correctly excludes local-only files, dependencies, and build artifacts.
- [ ] For NSoC contributions, the issue and PR have `nsoc26`, and the PR has exactly one correct level label (`level1`, `level2`, or `level3`).
- [ ] The PR is assigned to a contributor and linked to a valid, relevant issue.
- [ ] The PR has been reviewed by a maintainer before merging.
- [ ] Screenshots are included for meaningful UI changes.
- [ ] Program-specific requirements have been followed where applicable.

## Help

If you are unsure about scope or setup, ask in the relevant issue before investing in a large change.

Thank you for contributing to Box Office Inc - Movie Studio Simulator.


## Running Backend Tests

The backend test suite uses Node's native test runner (`node:test` and `node:assert`).

### Prerequisites
Ensure backend dependencies are installed:
```bash
cd backend
npm install
```

### Run the Full Backend Test Suite
Run the test suite with Node's automated test discovery:
```bash
cd backend
npm test
```
Or from the repository root:
```bash
npm test --prefix backend
```

### Run Core Movie Simulation Unit Tests
To run the unit tests for core calculations (box office revenue, review ratings, weekly payroll):
```bash
# From the backend directory:
node --test tests/coreMovieCalculations.test.js

# Or from the repository root:
node --test backend/tests/coreMovieCalculations.test.js
```

### Run Specific Test Files
You can target any specific test file directly:
```bash
# From the repository root:
node --test backend/tests/boxOfficeEngine.test.js
node --test backend/tests/engines.test.js
```
