# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Authentication screen (`AuthScreen`) and `AuthProvider` with `localStorage` API key persistence.
- Ky HTTP client with automatic retries for Azure Container Apps cold starts and RFC 7807 error parsing.
- Financial formatters for BRL currency and calendar date headers.
- Transaction category UI metadata mapping (colors and icons).
- Unit and integration test suite with Vitest (89 tests).
- Automated PR code review workflow via GitHub Actions.

### Removed
- Local AI agent metadata and planning artifacts (isolated to workspace root).
