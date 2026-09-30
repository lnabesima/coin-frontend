# Forged Idea: Coin Frontend v0.1 MVP Scope

## Outcome
HARDENED

## Locked Decisions
- **Core Value Proposition (v0.1):** Frictionless, private mobile expense logging (<5 seconds to log, zero third-party data tracking).
- **Forward-looking Budget Engine Deferred:** Safe daily spend and paycheck cycle calculations are postponed to v1 to eliminate backend schema blockers and wizardry.
- **Resilience & Optimistic UI:** Optimistic local-first UI updates for instant entry during Azure Container Apps cold-starts (5-15s). Terminal sync failures retain the item with an amber `Sync Failed` badge and retry toast.
- **Client Storage:** `localStorage` locked for API key and lightweight pending sync queue. No IndexedDB dependency needed for v0.1.
- **Dashboard Scope:** Monthly flow metrics only (Receitas do Mês, Despesas do Mês, Balanço do Mês). Cumulative net worth tracking deferred.

## Rejected Options
- **Generic Read-Only Ledger:** Rejected because personal dogfooding requires rapid transaction capture to replace spreadsheets.
- **Full Offline Sync Engine (IndexedDB):** Rejected as scope creep for v0.1.
- **Full Forward Budgeting in v0.1:** Rejected because backend lacks schema for fixed bills, budget targets, and pay cycles.

## Open Signals to Monitor
- An unarticulated user instinct remains noted; monitor during implementation for friction around mobile entry flow, recurring expenses, or pay cycles.
