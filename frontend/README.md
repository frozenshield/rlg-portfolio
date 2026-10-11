# 🌟 RLG Developer Portfolio & Interactive Architectural Workspace (Frontend)

<p align="center">
  <img src="src/assets/hero.png" alt="RLG Portfolio & Workspace Banner" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />
</p>

<p align="center">
  <strong>Senior Frontend Engineer & Creative UI Architect Portfolio</strong><br />
  A dual-surface developer portfolio featuring a modern light Bento grid UI and an immersive architectural workspace with interactive multi-device simulators, live proposal studios, slide deck talk tracks, and autonomous AI automation pipelines.
</p>

<p align="center">
  <a href="https://rlgonlineshop.com" target="_blank">
    <img src="https://img.shields.io/badge/Production-rlgonlineshop.com-emerald?style=for-the-badge&logo=google-chrome&logoColor=white" alt="RLG Online Shop Live" />
  </a>
  <a href="https://proposal-ai.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/ProposalAI-Vercel_Deploy-0d9488?style=for-the-badge&logo=vercel&logoColor=white" alt="ProposalAI Vercel Deploy" />
  </a>
  <a href="#-tech-stack--tooling">
    <img src="https://img.shields.io/badge/Vue_3.5-Composition_API-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" alt="Vue 3.5" />
  </a>
  <a href="#-tech-stack--tooling">
    <img src="https://img.shields.io/badge/Laravel_11-Clean_Architecture-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 11" />
  </a>
  <a href="#-tech-stack--tooling">
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL_pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase pgvector" />
  </a>
  <a href="#-tech-stack--tooling">
    <img src="https://img.shields.io/badge/Gemini_API-Flash--Lite_&_2.5_Pro-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini API" />
  </a>
  <a href="#-tech-stack--tooling">
    <img src="https://img.shields.io/badge/Payments-Stripe_&_PayMongo-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe & PayMongo" />
  </a>
</p>

---

## 📑 Table of Contents

1. [Architectural Concept & Dual-Surface Experience](#-architectural-concept--dual-surface-experience)
2. [Flagship Project 1: RLG Online Shop (E-Commerce Monorepo)](#-flagship-project-1-rlg-online-shop-e-commerce-monorepo)
3. [Flagship Project 2: ProposalAI (Enterprise B2B AI Proposal Generator)](#-flagship-project-2-proposalai-enterprise-b2b-ai-proposal-generator)
4. [Inner Project Workspace & Dynamic Theme Switching](#-inner-project-workspace--dynamic-theme-switching)
5. [Interactive Demos & Live Canvas Studios](#-interactive-demos--live-canvas-studios)
6. [Presentation Deck System (NotebookLM Style)](#-presentation-deck-system-notebooklm-style)
7. [AI Pipelines Deep Dive (Vision OCR vs. pgvector RAG)](#-ai-pipelines-deep-dive-vision-ocr-vs-pgvector-rag)
8. [Cloud Infrastructure & Deployment Topology (Railway & Vercel)](#-cloud-infrastructure--deployment-topology-railway--vercel)
9. [Codebase Architecture & Directory Structure](#-codebase-architecture--directory-structure)
10. [Reactive State Management (Pinia)](#-reactive-state-management-pinia)
11. [Local Development & Setup Guide](#-local-development--setup-guide)
12. [Developer Bio & Contact](#-developer-bio--contact)

---

## 🏛 Architectural Concept & Dual-Surface Experience

This portfolio is built on a **Dual-Surface UI Paradigm** engineered to solve the traditional developer portfolio paradox: high-level hiring managers want clean, legible overviews and quick metrics, while engineering leads, staff architects, and tech interviewers demand deep dives into architecture, live simulated applications, code quality, and infrastructure topology.

---

## 🛍️ Flagship Project 1: RLG Online Shop (E-Commerce Monorepo)

- **Domain:** Production at [rlgonlineshop.com](https://rlgonlineshop.com)
- **Tagline:** Full-Stack Monorepo Featuring Multimodal AI Automation
- **Aesthetic:** Dark Cybernetic Shell (`#090d16` to `#0f172a`, purple & cyan glows).
- **Core Stack:** Laravel 11, Vue 3, Inertia.js, MySQL, Redis, Gemini Vision OCR, Railway Cloud, Namecheap DNS.

---

## 💼 Flagship Project 2: ProposalAI (Enterprise B2B AI Proposal Generator)

- **Domain:** Production-ready at [proposal-ai.vercel.app](https://proposal-ai.vercel.app)
- **Tagline:** Production-grade multi-tenant B2B platform automating the drafting, financial modeling, and dispatch of high-conversion sales proposals using Gemini and Supabase pgvector.
- **Aesthetic:** Light Enterprise B2B SaaS Theme (`#f8fafc` background, pure white cards `#ffffff`, subtle slate borders `#e2e8f0`, teal `#0d9488` and emerald `#10b981` accents).
- **Core Stack:** Laravel 11 Clean Architecture, Vue 3.5, Inertia.js v3, PostgreSQL 17 on Supabase, `pgvector` (768-dim HNSW index), Gemini Flash-Lite 3.5 & 2.5 Pro, Stripe Cashier, PayMongo Gateway, Vercel Edge Cloud.

---

## 🎨 Inner Project Workspace & Dynamic Theme Switching

The Inner Workspace shell (`WorkspaceShell.vue`) dynamically adapts its layout and aesthetics depending on the active project selected via the top bar switcher:

| Feature | RLG Online Shop | ProposalAI |
| :--- | :--- | :--- |
| **Theme Aesthetic** | Dark Cybernetic (`#090d16` / `#0f172a`) | Light Enterprise B2B (`#f8fafc` / `#ffffff`) |
| **Accent Colors** | Indigo (`#6366f1`) & Purple (`#a855f7`) | Deep Teal (`#0d9488`) & Emerald (`#10b981`) |
| **Top Status Badges** | `Production: rlgonlineshop.com 🟢`, `Railway`, `Namecheap` | `Vercel Deploy 🟢`, `Supabase pgvector`, `Stripe & PayMongo` |
| **AI Status Pill** | `AI Services: Online 🟢` | `AI Services Active 🟢` |
| **Demos View** | Multi-Device DeviceSimulator (Admin vs. Buyer Storefront) | Live Proposal Studio & Document Canvas |
| **Cloud Topology** | Railway Container Orchestration & Redis | Vercel Edge Serverless & Supabase Database |

---

## 🚀 Local Development & Setup Guide

```bash
cd frontend
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

---

<p align="center">
  <sub>Engineered with precision using Vue 3, Vite, Tailwind CSS, Pinia, Supabase, and Google Antigravity. © 2026 RLG. All rights reserved.</sub>
</p>
