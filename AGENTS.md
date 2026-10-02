# Development Guidelines

## Git & Workflow Rules
- **No Automatic Commits**: Never make a git commit or push automatically. Always present the implemented changes for user review and wait for explicit confirmation before committing.
- **Git Flow**: Default development branch is `develop`. Production release branch is `main`. All feature branches originate from `develop` and must be targeted back to `develop` via Pull Requests.
- **Security & Secrets**: Never commit real production secrets, API keys, or credentials. The frontend bundle compiled by Vite must contain zero baked-in secrets. User API keys are stored solely on the client device in `localStorage`. Local development environment variables (e.g. `VITE_API_BASE_URL` in `.env.development`) are permitted for developer portability.
- **Language**: All code, commit messages, PR descriptions, issue titles, user stories, and documentation must be written in English.
- **Style**: Clean text only (no emojis in cards or commit messages).
- **Pull Request Titles**: Write PR titles as clean imperative sentences in English (e.g. `Build transaction modal component` or `[UI] Build transaction modal component`). Do not use Conventional Commits prefixes (such as `feat:` or `fix:`) in PR titles.

## Tooling & Code Quality
- **Linter & Formatter**: The repository uses **Biome** (`npm run check` / `npm run check:fix`). Do not introduce or run ESLint or Prettier.
- **Line Endings**: Always enforce `LF` line endings and `UTF-8` charset (configured in `.editorconfig` and `.gitattributes`).

## Cloud & Infrastructure
- **Hosting & CI/CD**: Azure Static Web Apps (Free tier) in Resource Group `rg-coin-lnabesima`. Production deployment occurs strictly on push to `main`. Initial deployments use the default Azure hostname (`*.azurestaticapps.net`).
- **Custom Domain**: Planned as `coin.lnabesima.dev` (pending domain/DNS provisioning).
- **Backend Integration**: Communicates directly with `coin-backend` hosted on Azure Container Apps. The client must gracefully handle ACA scale-to-zero cold-starts (5-15s) with non-blocking status indicators and automatic retries.

## Planning & Methodology
- **BMad Method**: This repository uses the **BMad** framework for requirements discovery, architecture decisions, and implementation workflows.
- **Artifacts Location**: All planning documents, design specifications, architecture records, and research reports must reside under `_bmad-output/` (as configured in `_bmad/config.toml`). Never create ad-hoc documentation or spec folders (such as `docs/superpowers/`).