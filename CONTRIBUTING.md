# Contributing

Thank you for your interest in contributing.

## 1) Development Setup

```bash
git clone <repo-url>
cd Archaeological-Site-Mapping-AI-V2
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Frontend setup:

```bash
cd geo-ai-ui
npm install
npm run dev
```

## 2) Branching

- Create a feature branch from main.
- Keep changes scoped and atomic.
- Use clear commit messages.

## 3) Code Quality Expectations

- Preserve existing folder structure and naming conventions.
- Avoid breaking model path resolution.
- Add or update documentation for behavior changes.
- Include validation evidence for model/metric changes.

## 4) Pull Request Checklist

- [ ] Code runs locally
- [ ] Documentation updated (`README.md` + relevant module docs)
- [ ] Metrics artifacts regenerated if model behavior changed
- [ ] No accidental large artifacts committed
- [ ] Clear summary of what changed and why

## 5) Reporting Issues

Include:

- steps to reproduce,
- expected vs actual behavior,
- logs/traceback,
- environment details.

## 6) Security

Do not commit secrets, API keys, or private datasets.
