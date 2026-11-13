# Changelog

All notable changes to the **Russel Luis Gementiza — Interactive Engineering Portfolio** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-10-18

### Added
- **Full RLG Online Shop Admin Command Center Integration (`AdminLayout.vue` & 12 Live Modules)**:
  - Integrated the exact production modules from `rlgshop`: `AdminDashboardView`, `AdminOrdersView`, `AdminInventoryView`, `AdminProductUploadView`, `AdminAuctionsView`, `AdminCustomersView`, `AdminMarketingView`, `AdminProSubscriptionView`, `AdminCmsView`, `AdminAnalyticsView`, `FastBatchScanner` (`MobileTools`), and `AdminSettingsView`.
- **Full Page Live App Mode (`Whole Page` View)**:
  - Added a **Full Page Live App (`Whole Page`)** navigation item right beside **Interactive Demos** in `WorkspaceSidebar.vue` and a quick-launch **Whole Page** button in `DeviceSimulatorFrame.vue`.
  - Recreates the entire application across the full viewport (`100vw × 100vh`) with a floating bottom-right controller pill to switch between **Admin Command Center**, **Buyer Storefront**, and **Exit Whole Page**.
- **Scoped Vue Router & Stateful Mock API Layer (`src/shims/`)**:
  - Added `src/shims/vue-router.ts` to scope `/admin/*` navigation inside the portfolio workspace without mutating the outer browser URL.
  - Added `src/shims/mockAdminApi.ts` intercepting `/api/*` endpoints with stateful RLG Hobby Shop telemetry, orders, inventory, AI vision/SEO generators, CRM conversations, and RBAC matrices.
  - Added lightweight browser shims for `@vueuse/core`, `@capacitor/*`, `yup`, and `axios`.

### Fixed
- **Removed Staff Portal Security Gate Blocker**:
  - Removed the `SecretQuestionModal` security challenge popup on Admin Panel load and auto-hydrated the default Super Admin session (`Russel Luis Gementiza`) so evaluators land directly in the Command Center Dashboard.
- **Fixed Doubled Surface/Resolution Toolbar**:
  - Removed the duplicate `DeviceSimulatorFrame` wrapper inside `AdminPanelDemo.vue` so the Admin Panel renders edge-to-edge inside a single simulator frame across Desktop (`1440px`), Tablet (`1024px`), and Mobile Phone (`390px`).

---

## [2.0.0] - 2026-10-13

### Added
- **ProposalAI — Enterprise B2B AI Proposal Generator**:
  - Added second featured enterprise project across the outer Bento Grid (`ProposalAiCard.vue`) and inner Project Workspace (`ProposalAiDemo.vue`).
  - Implemented light-enterprise theme switching, 8-slide technical architecture deck with speaker talk tracks, and multi-device simulation (`Desktop 1440px`, `Tablet 1024px`, `Mobile Phone 390px`) for ProposalAI views (Proposals Directory, Live Proposal Builder & Gemini RAG Canvas, Executive Dashboard, Client CRM, and Services Catalog).
- **Custom Profile & Brand Assets**:
  - Integrated `/profile.jpg` across portfolio navigation/hero avatars and `/rlg-logo.png` across RLG Online Shop branding.
- **Expanded Tech Stack Matrix**:
  - Added Supabase, PostgreSQL (`pgvector`), PayMongo Payment Gateway, and Vercel Cloud Deployment to the engineering skills matrix.

---

## [1.0.0] - 2026-10-08

### Added
- **Initial Release — Dual-Surface Interactive Engineering Portfolio**:
  - Outer Bento Grid portfolio (`PortfolioNavbar`, `HeroSection`, `BentoGrid`, `ProjectShowcaseCard`, `SkillsMatrix`).
  - Inner Project Workspace (`WorkspaceShell`, `WorkspaceSidebar`, `WorkspaceTopBar`, `SlideDeckViewer`, `ArchitectureView`, `AiPipelinesView`, `TechStackView`, `DeploymentView`).
  - Interactive `DeviceSimulatorFrame` with `BuyerStorefrontDemo` and responsive Desktop, Tablet, and Mobile Phone viewports.

