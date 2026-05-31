# Stockade Phase Status

Last updated: 2026-05-31.

This file maps the build prompt phases to current repository evidence. It is not
a substitute for the public deployment deliverables in phases 19-21 and 23.

## Summary

- Phases 0-18 are implemented and have local verification artifacts.
- Phase 22 documentation is implemented.
- Phases 19-21 have repo-side automation/configuration, but the actual public
  Docker Hub and hosted deployments still require external account access.
- Phase 23 is prepared with checklists and verification scripts, but cannot be
  completed until the public artifact URLs exist and are verified.

## Evidence Table

| Phase                                          | Status                         | Evidence                                                                                                                                                                                   |
| ---------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 - Repository initialization                  | Complete                       | `b26de2e`, root monorepo structure, `.gitignore`.                                                                                                                                          |
| 1 - Tooling and conventions                    | Complete                       | `8c38311`, `.pre-commit-config.yaml`, `.editorconfig`, env examples, Docker ignores.                                                                                                       |
| 2 - Backend scaffold                           | Complete                       | `661d58e`, health/readiness endpoints, settings, logging.                                                                                                                                  |
| 3 - Data model and migrations                  | Complete                       | `ad58564`, Alembic schema migrations under `backend/migrations/versions/`.                                                                                                                 |
| 4 - Backend/Postgres containerization and seed | Complete                       | `79394b9`, `backend/Dockerfile`, `compose.yaml`, idempotent bootstrap.                                                                                                                     |
| 5 - Authentication and authorization           | Complete                       | `5f76275`, token login and org-scoped dependencies.                                                                                                                                        |
| 6 - Product domain                             | Complete                       | `88528b0`, product service/API/tests; later extended by category, reorder point, stock adjustment, movement audit.                                                                         |
| 7 - Customer domain                            | Complete                       | `ca5b8e2`, customer service/API/tests; later extended by customer update.                                                                                                                  |
| 8 - Order domain and inventory logic           | Complete                       | `d18482c`, transactional multi-line orders and inventory tests; later scaled beyond 100 rows.                                                                                              |
| 9 - Dashboard, listing, and API polish         | Complete                       | `9b882b8`, dashboard metrics, pagination/filtering, OpenAPI surface.                                                                                                                       |
| 10 - Backend test hardening                    | Complete                       | `cfb4eda`, expanded backend rule/endpoint coverage.                                                                                                                                        |
| 11 - Frontend scaffold and auth integration    | Complete                       | `0c7e10c`, login, session, routing, app shell; later extended by refresh tokens.                                                                                                           |
| 12 - Frontend API and shared infrastructure    | Complete                       | `cf95275`, TanStack Query client/hooks and shared UI primitives.                                                                                                                           |
| 13 - Frontend product management               | Complete                       | `79a017d`, product CRUD UI; later extended with stock movement UI.                                                                                                                         |
| 14 - Frontend customer management              | Complete                       | `1c344f3`, customer list/create/delete; later extended with editing.                                                                                                                       |
| 15 - Frontend order management                 | Complete                       | `90d4b64`, multi-line order create/list/detail and insufficient-stock messaging.                                                                                                           |
| 16 - Frontend dashboard                        | Complete                       | `bf4af4f`, live dashboard metrics; later aligned with design-kit mockups.                                                                                                                  |
| 17 - Frontend containerization                 | Complete                       | `7b4d76c`, multi-stage frontend Docker image served by Nginx.                                                                                                                              |
| 18 - Full orchestration                        | Complete                       | `966cf70`, Compose frontend/backend/Postgres orchestration; `scripts/verify-local-stack.sh` exercises the complete local stack.                                                            |
| 19 - Docker Hub publishing                     | Repo-ready, externally blocked | `cc6f5c5`, `.github/workflows/publish-backend-image.yml`, `docs/dockerhub-overview.md`; still needs Docker Hub namespace/token and public pull verification.                               |
| 20 - Backend deployment                        | Repo-ready, externally blocked | `cc6f5c5`, `render.yaml`, platform port handling, managed Postgres URL normalization; still needs Render/Railway/Fly project and public backend URL.                                       |
| 21 - Frontend deployment and wiring            | Repo-ready, externally blocked | `cc6f5c5`, `frontend/vercel.json`, `scripts/verify-live-deployment.sh`; still needs Vercel/Netlify project, live backend URL, and live CORS verification.                                  |
| 22 - Documentation                             | Complete                       | `d8f461d`, README architecture/setup/deployment docs; later docs updated for refresh token, reports, deployment automation, and submission verification.                                   |
| 23 - Submission package and final acceptance   | Prepared, externally blocked   | `e2a8a10`, `c030c13`, `docs/submission.md`, verification scripts; still needs GitHub repo URL, Docker Hub image URL, live frontend URL, live backend URL, and public verification results. |

## Remaining External Inputs

To finish the blocked public phases, provide:

1. GitHub repository target and permission to add/push a remote.
2. Docker Hub namespace/repository and push-capable token.
3. Hosted backend platform choice and credentials/project access.
4. Production environment values: admin email, initial admin password,
   organization name, JWT secret policy, and allowed frontend origin.
5. Hosted frontend platform choice and project access.
6. Final public backend and frontend URLs for `scripts/verify-live-deployment.sh`.
