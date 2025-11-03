# Meeting Summarizer Workflow

An automated workflow system that uses AI agents to download, organize, and summarize meeting transcripts from Fathom. This project demonstrates a multi-agent orchestration pattern using the Anthropic Claude Agent SDK, where a planning agent creates a workflow plan that is then executed by specialized agents.

## Features

- **Automated Meeting Retrieval**: Downloads transcripts from Fathom for meetings from the past week
- **Smart Organization**: Organizes transcripts into folders based on meeting participants
- **AI-Powered Summaries**: Generates comprehensive summaries including:
  - Top 5 key points from each meeting
  - Key topics and their significance
  - Decision points with context
  - Action items with responsible parties and deadlines
  - Follow-up items for next meetings
- **Multi-Agent Architecture**: Uses a planning agent to create workflows and a summary agent to process transcripts
- **Fathom MCP Server**: Leverages the [Fathom MCP Server](../../mcp/fathom-mcp-servers/) for secure transcript access

## Architecture

The workflow operates in two phases:

1. **Planning Phase**: A planning agent analyzes available meetings and creates a structured plan
2. **Execution Phase**: A workflow agent executes the plan using available tools and delegates to the summary agent for transcript analysis

### Agents

- **Planning Agent**: Creates execution plans with controlled permissions (read-only operations)
- **Workflow Agent**: Executes plans with file system access and MCP tool access
- **Summary Agent**: Specialized agent for analyzing and summarizing meeting transcripts

## Prerequisites

- Node.js (v18 or higher)
- A Fathom account with API access
- Anthropic API key (for Claude Agent SDK)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nnance/claude-agents-hub.git
   cd claude-agents-hub/agents/meeting-summarizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create a .env file with your API keys
   FATHOM_API_KEY=your_fathom_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

## Usage

Run the workflow:

```bash
npm start
```

Or for development with hot reload:

```bash
npm run dev
```

The workflow will:
1. Query Fathom for meetings from the past week
2. Create a plan to download and organize transcripts
3. Execute the plan by downloading transcripts to `./meetings` folder
4. Generate summaries for each transcript in markdown format

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with hot reload
- `npm start` - Build and run the compiled application
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code with Biome
- `npm run format` - Format code with Biome
- `npm run format:check` - Check code formatting

### Project Structure

```
agent-fathom-workflow/
├── src/
│   └── index.ts          # Main application with agent definitions and workflow
├── meetings/             # Output directory for downloaded transcripts (created at runtime)
├── package.json
├── tsconfig.json
├── biome.json
└── README.md
```

## Dependencies

- **@anthropic-ai/claude-agent-sdk**: Core SDK for building AI agent workflows
- **@elevated-agents/claude-tools**: Claude Agent SDK toolbox implementation for Fathom integration
- **dotenv**: Environment variable management

## Configuration

The workflow can be customized by modifying the prompts in [src/index.ts](src/index.ts):

- `SYSTEM_PROMPT`: Overall system behavior and context
- `WORKFLOW_PROMPT`: Instructions for the workflow agent
- `PLANNING_PROMPT`: Instructions for the planning agent
- `SUMMARY_PROMPT`: Instructions for the summary sub-agent

You can also adjust:
- `maxTurns`: Maximum number of agent turns for each phase
- `permissionMode`: Control level of approval required for agent actions
- `allowedTools`: Restrict which tools agents can use

## License

ISC
