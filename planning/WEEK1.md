# Week 1 — Foundations

**Theme:** Get the project skeleton up and start building ML intuition.

## End-of-Week Deliverables

- Public GitHub repo with proper folder structure, .gitignore, CLAUDE.md, README placeholder
- Next.js + TypeScript frontend running on localhost:3000
- Python FastAPI backend running on localhost:8000
- Frontend successfully fetching from backend
- Solid mental model of what an embedding is

## Branch Workflow (every day)

1. `git checkout main && git pull`
2. `git checkout -b <branch-name>`
3. Do the work, commit on the branch
4. `git push -u origin <branch-name>`
5. Open PR on GitHub, review your own diff, merge, delete branch on GitHub
6. Locally: `git checkout main && git pull && git branch -d <branch-name>`

---

## Day 1 — Project skeleton (~2 hours) [COMPLETE]

Done directly on `main` — initial scaffolding. No branch needed.

Repo cloned, CLAUDE.md added, frontend/ and backend/ folders created, .gitignore set up, first commit pushed.

---

## Day 2 — Frontend scaffolding (~2-3 hours)

**Branch:** `chore/scaffold-frontend`

1. `git checkout main && git pull`
2. `git checkout -b chore/scaffold-frontend`
3. Install Node.js via nvm (https://github.com/nvm-sh/nvm). Then `nvm install --lts && nvm use --lts`.
4. Verify: `node --version` and `npm --version`.
5. `cd frontend`
6. Initialize Next.js: `npx create-next-app@latest .`
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - src/ directory: Yes
   - App Router: Yes
   - Turbopack: Yes
   - Customize import alias: No
7. Run: `npm run dev`. Verify localhost:3000 shows Next.js welcome page.
8. Stop server. `cd ..`
9. Commit: `git add . && git commit -m "Scaffold Next.js frontend"`
10. Push: `git push -u origin chore/scaffold-frontend`
11. PR on GitHub → review diff → merge → delete branch.
12. Local cleanup: `git checkout main && git pull && git branch -d chore/scaffold-frontend`

---

## Day 3 — ML fundamentals: embeddings (~2 hours)

**Branch:** `chore/embedding-notes`

No coding. **Don't skip this day.**

1. `git checkout main && git pull`
2. `git checkout -b chore/embedding-notes`
3. Read Jay Alammar's "The Illustrated Word2Vec": https://jalammar.github.io/illustrated-word2vec/
4. Watch 3Blue1Brown's "But what is a neural network?" on YouTube.
5. Watch any 10-15 minute "what are vector embeddings" overview video.
6. Create `notes/embeddings.md`. Answer in 3-5 sentences: "What is an embedding? Why is the distance between two embeddings meaningful?"
7. Commit: `git add notes/ && git commit -m "Day 3 notes: embeddings"`
8. Push: `git push -u origin chore/embedding-notes`
9. PR → review → merge → delete branch.
10. Local cleanup.

---

## Day 4 — ML fundamentals: hands-on (~2-3 hours)

**Branch:** `chore/ml-fundamentals-notebook`

Goal: run a model in Python and look at an embedding.

1. `git checkout main && git pull`
2. `git checkout -b chore/ml-fundamentals-notebook`
3. Install Python via Homebrew if needed: `brew install python@3.12`. Verify 3.11+.
4. Install uv: `brew install uv`
5. `cd backend`
6. `uv init && uv venv`
7. Activate venv: `source .venv/bin/activate`
8. Install ML libs: `uv pip install jupyter transformers torch sentence-transformers`
9. Run Jupyter: `jupyter notebook`
10. Create `embedding_hello.ipynb`. Use Claude Code for help, but understand each line. Code should:
    - Load a small sentence-transformer model
    - Embed: "I love pizza", "Pizza is great", "The car is red"
    - Compute cosine similarity between pairs
    - Print embeddings and similarities
11. Observe: similar sentences = higher similarity. **Make sure you understand why.**
12. `deactivate`, `cd ..`
13. Commit: `git add . && git commit -m "ML fundamentals: embedding similarity notebook"`
14. Push: `git push -u origin chore/ml-fundamentals-notebook`
15. PR → review → merge → delete branch.
16. Local cleanup.

---

## Day 5 — Backend scaffolding (~2-3 hours)

**Branch:** `chore/scaffold-backend`

Goal: FastAPI hello-world running locally.

1. `git checkout main && git pull`
2. `git checkout -b chore/scaffold-backend`
3. `cd backend`
4. Activate venv: `source .venv/bin/activate`
5. Install FastAPI: `uv pip install fastapi uvicorn`
6. Create `main.py` with a basic FastAPI app. One endpoint: `GET /api/health` returning `{"status": "ok"}`.
7. Run: `uvicorn main:app --reload --port 8000`
8. Verify localhost:8000/api/health returns JSON. Also check localhost:8000/docs.
9. Stop server. Generate requirements: `uv pip freeze > requirements.txt`
10. `deactivate`, `cd ..`
11. Commit: `git add . && git commit -m "Scaffold FastAPI backend with health endpoint"`
12. Push: `git push -u origin chore/scaffold-backend`
13. PR → review → merge → delete branch.
14. Local cleanup.

---

## Day 6 — Connect frontend ↔ backend (~2-3 hours)

**Branch:** `feature/health-check-integration`

Goal: Next.js page fetches from FastAPI. First real feature.

1. `git checkout main && git pull`
2. `git checkout -b feature/health-check-integration`
3. Run both servers in separate terminal tabs:
   - Tab 1: `cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000`
   - Tab 2: `cd frontend && npm run dev`
4. Modify `frontend/src/app/page.tsx`: add a button that fetches `http://localhost:8000/api/health` on click and displays the response.
5. Click → expect a CORS error. **This is normal.**
6. In `backend/main.py`, add CORS middleware to allow `http://localhost:3000`. Read the code, understand it.
7. Verify: button click renders the JSON response. **Full stack works end to end.**
8. Commit: `git add . && git commit -m "Add health check integration between frontend and backend"`
9. Push: `git push -u origin feature/health-check-integration`
10. PR → review → merge → delete branch.
11. Local cleanup.

---

## Day 7 — Wrap up + plan Week 2 (~1-2 hours)

**Branch:** `chore/week-1-wrapup`

1. `git checkout main && git pull`
2. `git checkout -b chore/week-1-wrapup`
3. Confirm Days 2-6 are merged into main (check GitHub).
4. Update `CLAUDE.md`: mark Week 1 complete, add a "Week 1 Retrospective" subsection (what went smoothly, what was slow, anything unexpected).
5. Commit: `git add CLAUDE.md && git commit -m "Update CLAUDE.md with Week 1 wrap-up"`
6. Push: `git push -u origin chore/week-1-wrapup`
7. PR → review → merge → delete branch.
8. Local cleanup.
9. Reflect for 15 minutes: did I work as much as planned? Anything way harder/easier than expected?
10. Come back to chat to plan Week 2.

---

## If You Get Stuck

- Concept confusion → ask in this chat
- Code/error → ask Claude Code in your repo
- Whole-day-blocking issue → bring it back here, don't push through