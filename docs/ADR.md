# Architecture Decision Record (ADR)

## ADR-001: Technology Stack Selection

**Date:** 2026-04-27
**Status:** Accepted
**Author:** LifeCore Developer

### Context
LifeCore is an AI-powered life tracker designed for a solo developer. The application needs to be cross-platform (iOS, Android, Web), use AI for natural language interfaces, and integrate with external services (Google Calendar, nutrition APIs, finance APIs).

### Decision
- **Frontend:** React Native with Expo for cross-platform mobile and web
- **Backend:** Node.js with Express (REST API)
- **Database:** PostgreSQL via Supabase
- **AI:** Anthropic Claude (primary), with adapter pattern for provider flexibility
- **Authentication:** JWT with refresh tokens, Supabase Auth integration

### Rationale
1. React Native + Expo provides fastest path to iOS/Android/Web from single codebase
2. Express is lightweight and well-suited for single-developer maintenance
3. Supabase provides built-in PostgreSQL, auth, storage, and RLS - reducing boilerplate
4. Claude is cost-effective for the usage pattern; adapter pattern allows switching if needed

### Consequences
- Positive: Single language (TypeScript) across full stack
- Positive: Supabase RLS simplifies multi-tenant data isolation
- Negative: Some vendor lock-in with Supabase
- Negative: AI API costs must be monitored

---

## ADR-002: AI Feature Design Pattern

**Date:** 2026-04-27  
**Status:** Accepted

### Context
AI features (tracker generation, workout planning, food analysis) require multi-step interactions where users can preview and modify before committing.

### Decision
All agentic AI workflows follow a 6-step pattern:
1. User submits natural language prompt
2. AI analyzes intent and generates plan (streamed to UI)
3. System presents preview with estimated completion
4. User confirms, modifies, or cancels
5. System executes confirmed plan, saves to database
6. User receives confirmation with edit options

### Rationale
- Preview-first prevents AI hallucinations from causing data corruption
- User maintains control over AI-generated content
- Matches IEEE standard for user-editable AI outputs

---

## ADR-003: Authentication Strategy

**Date:** 2026-04-27
**Status:** Accepted

### Context
Need secure authentication for a mobile/web app with offline considerations.

### Decision
- JWT access tokens (1-hour expiry)
- Refresh tokens (30-day expiry, rotate on use)
- Supabase user table with password hashing (not relying solely on Supabase Auth for custom auth flow)
- All API endpoints require authentication except health check

### Rationale
- JWT is stateless and scales well
- Short-lived access tokens limit exposure window
- Refresh rotation provides security while maintaining UX

---

## ADR-004: Theme System Architecture

**Date:** 2026-04-27
**Status:** Accepted

### Context
LifeCore supports multiple themes (Gaming, Professional, Light/Dark) that apply to UI, timers, notifications, and sounds.

### Decision
- Theme tokens stored in `/theme` module
- React Context for real-time theme switching (no app restart)
- Theme config includes: colors, typography, spacing, border radius, shadows, icon set, sound scheme
- Optional: theme scheduler for automatic switching

### Rationale
- Token-based design allows consistent theming across components
- React Context provides instant updates without re-rendering entire app

---

## ADR-005: Data Security & Privacy

**Date:** 2026-04-27
**Status:** Accepted

### Context
GDPR/CCPA compliance required before monetization. Privacy by design is a core principle.

### Decision
- All user data encrypted at rest (Supabase) and in transit (TLS)
- No user data sent to AI providers without explicit consent
- AI prompts are sanitized to prevent prompt injection
- Food photos processed server-side, not stored - only nutrition results saved
- JWT secret rotation every 6 months

### Rationale
- Aligns with SDLC privacy requirements
- Builds user trust for enterprise adoption