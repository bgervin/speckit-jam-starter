# The $100 Test — SpecKit Hands-on Lab Starter

> **📋 This repo is part of the [SpecKit Hands-on Lab](https://bgervin.github.io/speckit-jam-instructor/).** 
> Head there for the full step-by-step workshop instructions.

A web app for teams to run **$100 prioritization exercises** — a well-known PM technique where participants allocate a hypothetical $100 across competing options to surface true priorities.

## 🚀 Workshop Instructions

**👉 [Open the Hands-on Lab Guide](https://bgervin.github.io/speckit-jam-instructor/)**

The guide walks you through:
1. Forking and setting up this repo
2. Using **SpecKit + Copilot CLI** to add new features via spec-driven development
3. Running the full workflow: `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`

## Quick Start

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Run Tests

```bash
npm test
```

## What's Included

This starter repo comes with two features fully spec'd and implemented:

| Feature | Spec | Description |
|---|---|---|
| **Create Session** | `specs/001-create-session/spec.md` | Facilitator creates a voting session with items |
| **Cast Votes** | `specs/002-cast-votes/spec.md` | Participants distribute $100 across items |

## Workshop: Add More Features with SpecKit

During the AI Forward Hands-on Lab, you'll use **SpecKit + GitHub Copilot CLI** to add new features:

1. **View Results Dashboard** — Visualize aggregated voting results
2. **Share Session** — Generate shareable voting links
3. **Close Session** — Lock voting when done
4. **Export Results** — Download results as CSV

Follow the [Hands-on Lab instructions](https://bgervin.github.io/speckit-jam-instructor/) for step-by-step guidance.

## Project Structure

```
├── constitution.md          # App identity and standards
├── specs/                   # Feature specifications
│   ├── 001-create-session/
│   │   └── spec.md
│   └── 002-cast-votes/
│       └── spec.md
├── src/
│   ├── server.js            # Express app + routes
│   ├── sessions.js          # Session management
│   └── votes.js             # Vote management
├── public/
│   └── index.html           # Web interface
├── tests/
│   ├── sessions.test.js
│   └── votes.test.js
└── package.json
```

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sessions` | Create a new voting session |
| GET | `/api/sessions/:code` | Get session details |
| POST | `/api/sessions/:code/votes` | Cast a vote |
