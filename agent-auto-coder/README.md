# Agent Auto Coder

This project is an experimental tool that leverages Anthropic's Agent SDK to automatically generate code based on user requirements. It utilizes the Anthropic API to power its AI capabilities.

This agent is designed to take high-level specifications and implement them in code, streamlining the development process and reducing manual coding effort.  The agent runs in non-interactive mode, making it suitable for automated workflows.

## Features

- Automatic code generation from user requirements
- Integration with Anthropic's Agent SDK
- Non-interactive operation for seamless automation
- Docker support for containerized execution

## Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for containerized execution)
- Anthropic API key (set via `ANTHROPIC_API_KEY` environment variable)

## Local Development

### Setup

1. Clone the repository:
```bash
git clone https://github.com/nnance/agent-auto-coder.git
```

2. Navigate to the project directory:
```bash
cd agent-auto-coder
```

3. Install dependencies:
```bash
npm install
```

4. Create a `.env` file with your API key:
```bash
echo "ANTHROPIC_API_KEY=your-key-here" > .env
```

5. Run the agent:
```bash
npm start "Your prompt here"
```

## Docker Usage

### Build the Docker Image

```bash
docker build -t agent-auto-coder .
```

### Run with Docker

```bash
docker run --env ANTHROPIC_API_KEY=your-key-here agent-auto-coder "Your prompt here"
```

Or using environment file:
```bash
docker run --env-file .env agent-auto-coder "Your prompt here"
```

### Run with Docker Compose

1. Ensure your `.env` file contains `ANTHROPIC_API_KEY`:
```bash
echo "ANTHROPIC_API_KEY=your-key-here" > .env
```

2. Run the container:
```bash
docker-compose run --rm agent-coder "Your prompt here"
```

Or with a specific prompt in the docker-compose.yml:
```bash
docker-compose run --rm agent-coder
```

### Examples

Generate a utility function:
```bash
docker run --env-file .env agent-auto-coder "Create a function that validates email addresses"
```

Refactor existing code (from local file mounted as volume):
```bash
docker run --env-file .env -v $(pwd):/app/input agent-auto-coder "Refactor the code in input/utils.js to improve performance"
```

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the agent with a prompt argument
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

## Environment Variables

- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
