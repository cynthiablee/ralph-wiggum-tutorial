# Ralph Wiggum Tutorial

A full-stack tutorial application demonstrating Flask + React Islands architecture for modern web applications.

## Quick Start

### Setup

```bash
./script/setup
```

This initializes the Python virtual environment, installs dependencies, sets up the database, and seeds sample data.

### Development Server

```bash
./script/server
```

Starts both the Flask backend (http://localhost:5000) and React frontend (http://localhost:5173).

## Configuration

### Hugging Face API Token (Required for Comic Generation)

To use the comic generation feature, you need a Hugging Face API token. Even though the models used are free (`Qwen/Qwen2.5-7B-Instruct` and `black-forest-labs/FLUX.1-schnell`), the API requires authentication.

1.  **Get a Token:**
    *   Sign up or log in at [huggingface.co](https://huggingface.co/join).
    *   Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens).
    *   Click "Create new token".
    *   Give it a name (e.g., `ralph-wiggum-comic`) and select "Read" permissions.
    *   Copy the token (starts with `hf_...`).

2.  **Configure Environment:**
    *   Add the token to your `.env` file:
        ```bash
        HF_API_TOKEN=hf_your_token_here
        ```
    *   Restart the server: `./script/server`

## Tech Stack

- **Backend**: Flask 3, SQLAlchemy 2, Python 3.11+
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Testing**: pytest (backend), Vitest (frontend)
- **Tooling**: ESLint, pre-commit hooks

## Project Structure

```
.
├── src/app/                # Flask application
│   ├── models/            # SQLAlchemy ORM models
│   ├── routes/            # API endpoints
│   └── config.py          # Flask configuration
├── frontend/              # React application
│   ├── src/               # React components & pages
│   ├── tests/             # Component & unit tests
│   └── vite.config.ts     # Vite configuration
├── migrations/            # Alembic database migrations
├── tests/                 # Backend integration tests
└── script/                # Development & maintenance scripts
```

## Development Commands

- **Run tests**: `./script/test`
- **Lint code**: `./script/lint`
- **Type checking**: `./script/typecheck`
- **Database console**: `./script/console`
- **Seed database**: `./script/db-seed`

## Architecture: React Islands

This application uses the **React Islands** pattern to selectively hydrate interactive components within server-rendered pages. This approach allows you to:

- Keep most pages lightweight and server-rendered
- Add rich interactivity only where needed
- Minimize JavaScript payload for better performance
- Maintain a clean separation between static and dynamic content

Each "island" is an independent React component that handles its own state and interactivity, while the rest of the page remains static HTML.

## License

Educational tutorial application.
