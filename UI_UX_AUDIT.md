# TRACX UI/UX Audit

## Scope

This audit covers the existing React/Vite shell and the API-backed feature views present in `frontend/src`.

## Existing product surfaces

- **Navigation:** persistent sidebar with Overview, Investigation, Exposure Intelligence, Data Management, Detection, Analysis, and System groups.
- **Operational shell:** shared header exposes the current workspace, streaming source, simulation controls, and active incident count.
- **Functional views:** command center, live event stream, incident investigation/attack graph, exposure analysis, ingestion, telemetry coverage, validation, reports, evaluation, and settings.
- **Data integration:** feature views use `frontend/src/services/api.ts` and the FastAPI endpoints under `backend/app/api`.

## Findings

1. The application shell and feature routing are reusable and should be preserved.
2. The original starter CSS remained in the workspace and conflicted with the product token system.
3. The previous token set used a generic indigo/blue SaaS palette rather than the TRACX green, sage, cream, and olive direction.
4. Sidebar styling depended on light-theme variables, which became unreadable when using a dark operational rail.
5. Backend-backed values are already available in the dashboard and investigation flows; redesign work must not replace them with fabricated metrics.
6. Some feature-level controls and visualizations require separate workflow-specific refinement beyond this shell pass.

## Changes in this pass

- Replaced starter/global tokens with a restrained TRACX design system.
- Added a deep green-black navigation rail and warm neutral workspace surfaces.
- Standardized typography, spacing, borders, semantic severity colors, focus states, and compact controls.
- Preserved all existing routes, API contracts, and feature components.

## Remaining work

- Add workflow-specific search, sorting, pagination, and evidence expansion where the current API supports them.
- Refine graph legends and evidence panels around the existing graph response.
- Add explicit loading/error states to feature views that still use local fallback rendering.
- Capture responsive screenshots at desktop and narrow viewport widths.
