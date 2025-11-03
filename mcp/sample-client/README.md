# MCP Sample Client

This directory contains a sample client implementation demonstrating how to integrate MCP (Model Context Protocol) servers with Claude AI. The client shows how to connect to MCP servers, discover available tools, and enable Claude to intelligently use those tools to answer user queries.

## What This Does

The sample client demonstrates a complete integration pattern:

1. **Connects to an MCP server** (like the Fathom MCP Server) via stdio transport
2. **Discovers available tools** dynamically from the connected server
3. **Integrates with Claude API** to enable intelligent tool usage
4. **Processes user queries** by allowing Claude to decide when and how to use MCP tools
5. **Provides an interactive chat interface** for testing MCP server functionality

## Architecture

```
User Query
    ↓
Sample Client (MCPClient)
    ↓
Claude API (with MCP tools)
    ↓
Tool Selection + Invocation
    ↓
MCP Server (e.g., Fathom)
    ↓
External API (e.g., Fathom API)
    ↓
Response → Claude Processing → Final Response
```

## Prerequisites

Before using the sample client, you need to:

### 1. Build the MCP Server

The sample client requires a built MCP server to connect to. For example, to build the Fathom MCP Server:

```bash
# Navigate to the server directory
cd ../fathom-mcp-server

# Install dependencies
npm install

# Build the server
npm run build

# This creates the compiled server at dist/index.js
```

### 2. Set Up Environment Variables

Create a `.env` file in the sample-client directory with required API keys:

```bash
# Required for Claude API access
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Required for Fathom MCP Server functionality
FATHOM_API_KEY=your-fathom-api-key-here
```

**Getting API Keys:**
- **Anthropic API Key**: Obtain from [Anthropic Console](https://console.anthropic.com/)
- **Fathom API Key**: Obtain from your Fathom account settings > API section

## Installation

Install the sample client dependencies:

```bash
npm install
```

## Usage

### Quick Start

```bash
# Build and run the client (connects to Fathom MCP Server by default)
npm start
```

This automatically:
1. Builds the TypeScript code
2. Starts the client connected to the Fathom MCP Server
3. Launches an interactive chat interface

### Manual Usage

You can also run the client manually with a specific server path:

```bash
# Build the client
npm run build

# Run with a specific MCP server
node dist/index.js /path/to/mcp-server/dist/index.js

# Example: Connect to Fathom MCP Server
node dist/index.js ../fathom-mcp-server/dist/index.js
```

### Interactive Chat

Once the client starts, you'll see:

```
Connected to MCP server
Available tools: list_meetings, get_summary, get_transcript
Starting interactive chat (type 'quit' to exit)
You:
```

You can now ask questions that will be processed by Claude using the available MCP tools.

### Example Queries

Here are example queries you can try with the Fathom MCP Server:

```
You: What meetings did I have last week?

You: Get me the summary for recording ID 12345

You: Show me all meetings where john@example.com was an attendee

You: What meetings were recorded by sarah@example.com in the last 30 days?

You: Get the transcript for the most recent meeting
```

Claude will automatically determine which MCP tools to use and how to use them based on your query.

## Key Features

- **Dynamic Tool Discovery**: Automatically detects all tools provided by the connected MCP server
- **Claude Integration**: Uses Claude Sonnet 4.5 for intelligent query processing and tool selection
- **Conversational Context**: Maintains conversation history across tool calls
- **Type-Safe Implementation**: Full TypeScript with strict mode enabled
- **Environment-Based Configuration**: API keys loaded from `.env` file
- **Interactive Chat Interface**: User-friendly readline-based interaction

## Development

### Project Structure

```
sample-client/
├── src/
│   └── index.ts           # Main client implementation (MCPClient class)
├── dist/                  # Compiled JavaScript output
├── node_modules/          # Dependencies
├── .env                   # Environment variables (not in git)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

### Available Scripts

```bash
npm run build      # Compile TypeScript to dist/
npm start          # Build and run client with Fathom server
npm run lint       # Check code with Biome
npm run lint:fix   # Auto-fix linting issues
npm run format     # Format code with Biome
```

### Dependencies

- **@anthropic-ai/sdk** (v0.68.0): Anthropic Claude API client
- **@modelcontextprotocol/sdk** (v1.20.2): MCP protocol implementation
- **dotenv** (v17.2.3): Environment variable loading
- **@biomejs/biome** (dev): Code linting and formatting
- **typescript** (dev): Type checking and compilation

## How It Works

### 1. Server Connection

The `MCPClient` class connects to an MCP server by:
- Spawning the server as a subprocess
- Establishing stdio-based communication
- Discovering available tools from the server
- Converting MCP tool schemas to Claude-compatible format

### 2. Query Processing

When you submit a query:
1. The query is sent to Claude API with all available MCP tools
2. Claude analyzes the query and decides if tools are needed
3. If tools are needed, Claude generates tool invocations with parameters
4. The client executes tool calls via the MCP server
5. Results are sent back to Claude for processing
6. Claude generates a final response incorporating the tool results

### 3. Tool Invocation Flow

```typescript
// Claude decides to use a tool
{
  "tool_name": "list_meetings",
  "input": {
    "createdAfter": "2025-10-27T00:00:00Z",
    "includeTranscript": false
  }
}

// Client executes via MCP protocol
const result = await client.callTool({
  name: "list_meetings",
  arguments: { ... }
});

// Result returned to Claude
{
  "content": [{
    "type": "text",
    "text": "[{meeting1}, {meeting2}, ...]"
  }]
}

// Claude processes and responds
"You had 3 meetings last week: ..."
```

## Building Other MCP Servers

To use this client with other MCP servers:

1. **Build your MCP server**:
   ```bash
   cd /path/to/your-mcp-server
   npm install
   npm run build
   ```

2. **Point the client to your server**:
   ```bash
   node dist/index.js /path/to/your-mcp-server/dist/index.js
   ```

3. **Ensure required environment variables** are set in `.env`

## Troubleshooting

### "ANTHROPIC_API_KEY not found"
- Ensure `.env` file exists in the sample-client directory
- Verify `ANTHROPIC_API_KEY` is set in `.env`

### "Cannot find module"
- Run `npm install` in both the client and server directories
- Ensure the server is built with `npm run build`

### Server connection issues
- Verify the server path is correct and points to a `.js` file
- Check that the server builds without errors
- Ensure the server implements the MCP protocol correctly

### Tool calls fail
- Check that required API keys (e.g., `FATHOM_API_KEY`) are set
- Verify the API keys are valid and have proper permissions
- Review server logs for specific error messages

## Related Documentation

- [MCP Folder README](../README.md) - Overview of all MCP servers and structure
- [Fathom MCP Server](../fathom-mcp-server/README.md) - Documentation for the Fathom integration
- [MCP Protocol Specification](https://modelcontextprotocol.io/) - Official MCP documentation
- [Anthropic Claude API](https://docs.anthropic.com/) - Claude API documentation

## License

See the main repository LICENSE file for details.