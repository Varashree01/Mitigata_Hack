# Tracx UI Standardization & Design System

## 1. Overview

This document specifies the global typography, 4px spacing scale, component sizing, and visual design standards implemented across the **Tracx** Kill Chain Intelligence Platform, inspired by the clean, cyber-focused design language of **HackCulture** (https://hackculture.io/).

---

## 2. Typography System & Type Scale

The platform utilizes a multi-family typographic hierarchy:
- **Display & Headings**: `Space Grotesk` (`--font-display`), sans-serif — used for page titles, section headers, metric numerical displays, and brand identity.
- **Interface & Body**: `Inter` (`--font-sans`), sans-serif — used for body text, navigation items, buttons, form inputs, and table headers/content.
- **Technical & Monospace**: `JetBrains Mono` (`--font-mono`), monospace — strictly restricted to technical identifiers (event IDs, rule IDs, IP addresses, hashes, timestamps, and raw telemetry).

| Element | Size | Weight | Font Family | CSS Token / Class |
| :--- | :--- | :--- | :--- | :--- |
| **Page Headings** | 26px (`1.625rem`) | 600 | `Space Grotesk` | `--font-size-page-title` / `.page-title` |
| **Section Headings** | 18px (`1.125rem`) | 600 | `Space Grotesk` | `--font-size-section-title` / `.section-title` |
| **Card / Panel Titles**| 15px (`0.9375rem`) | 600 | `Space Grotesk` | `--font-size-panel-title` / `.panel-title` |
| **Body Text** | 13.5px (`0.84rem`)| 400 | `Inter` | `--font-size-body` |
| **Sidebar Navigation** | 13.5px (`0.84rem`)| 500 | `Inter` | `--font-size-sidebar-nav` |
| **Header Text** | 13px (`0.8125rem`)| 500 | `Inter` | `--font-size-header` |
| **Table Headers** | 12px (`0.75rem`) | 600 | `Inter` | `--font-size-table-header` / `.table-header-cell` |
| **Table Content** | 13px (`0.8125rem`)| 400 | `Inter` | `--font-size-table-content` / `.table-body-cell` |
| **Metric Values** | 26px (`1.625rem`) | 600 | `Space Grotesk` | `--font-size-metric-value` |
| **Metric Labels** | 12px (`0.75rem`) | 500 | `Inter` | `--font-size-metric-label` |
| **Secondary / Helper** | 12px (`0.75rem`) | 400 | `Inter` | `--font-size-helper` / `.helper-text` |
| **Metadata** | 11px (`0.6875rem`)| 400 | `Inter` | `--font-size-metadata` / `.metadata-text` |
| **Buttons** | 13px (`0.8125rem`)| 500 | `Inter` | `--font-size-btn` / `.btn-primary`, `.btn-secondary` |
| **Badges / Tags** | 11px (`0.6875rem`)| 500 | `Inter` | `--font-size-badge` |

---

## 3. 4px-Based Spacing Scale

Spacing across margins, paddings, and flex/grid gaps follows an explicit 4px arithmetic progression:

| Token | Dimension | Common Application |
| :--- | :--- | :--- |
| `--space-1` | 4px | Icon-to-label inline gaps, micro badge padding |
| `--space-2` | 8px | Button inline gap, compact inner padding, chip spacing |
| `--space-3` | 12px | Form field gap, table cell vertical padding, sub-panels |
| `--space-4` | 16px | Standard card/panel padding, toolbar spacing |
| `--space-5` | 20px | Major container padding, metric card inner padding |
| `--space-6` | 24px | Section vertical gaps, page header margins |
| `--space-8` | 32px | Major layout division, empty state vertical margins |

---

## 4. Standardized Component Dimensions & Color System

- **Surfaces & Canvases**:
  - Application background: `#F8FAFC` (clean, luminous slate)
  - Card & panel surface: `#FFFFFF`
  - Subtle background: `#F1F5F9`
  - Crisp borders: `#E2E8F0`
- **Brand Colors (HackCulture Accent)**:
  - Primary Indigo Accent: `#4F46E5`
  - Hover state: `#4338CA`
  - Active state: `#3730A3`
  - Subtle tint: `#EEF2FF`
  - Tint border: `#C7D2FE`
- **Severity & Status**:
  - Critical: `#EF4444` (bg: `#FEF2F2`, border: `#FECACA`)
  - High: `#F97316` (bg: `#FFF7ED`, border: `#FED7AA`)
  - Medium: `#F59E0B` (bg: `#FFFBEB`, border: `#FDE68A`)
  - Low / Success: `#10B981` (bg: `#ECFDF5`, border: `#A7F3D0`)
  - Info / Blue: `#3B82F6` (bg: `#EFF6FF`, border: `#BFDBFE`)
- **Component Geometry**:
  - Top Header: `58px` (`--header-height`), with compact breadcrumbs and vital status indicators.
  - Sidebar: `240px` expanded, `64px` collapsed, `38px` row height with `17px` iconography.
  - Metric Cards: Compact `84px` minimum height, `12px 14px` padding, responsive grid (`minmax(155px, 1fr)`).
  - Table Rows: `44px` height (`--table-row-height`), with `nowrap` on technical identifiers.
  - Buttons: Standardized `.btn-primary` (`#4F46E5`, 34px height) and `.btn-secondary` (`#FFFFFF` with `#E2E8F0` border).

---

## 5. Technical Identity & Interface Copy

All interface titles, descriptions, and labels strictly adhere to real-world cybersecurity SOC conventions:
- No AI fluff or marketing buzzwords.
- Direct, functional labels for analysts (Command Center, Live Event Stream, Attack Graph, Forward Reachability, Telemetry Coverage, Rule Validation Lab, Forensic Reports, Independent Evaluation, Platform Settings).
- Strict evidentiary distinction maintained between confirmed compromise and potential forward reachability.
