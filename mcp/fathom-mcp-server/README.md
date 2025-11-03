# Fathom MCP Server

Fathom meeting transcription MCP server - A Model Context Protocol (MCP) server that provides access to Fathom meeting recordings, summaries, and transcripts.

## Overview

This MCP server integrates with the Fathom API to provide:
- List meetings with flexible filtering options
- Retrieve meeting summaries
- Access meeting transcripts with speaker information
- TypeScript with strict type checking and Zod validation
- Biome for linting and formatting
- Native Node.js test runner for tests

## Installation

```bash
npm install
```

## Configuration

The server requires a Fathom API key to function. Set the environment variable:

```bash
export FATHOM_API_KEY="your-api-key-here"
```

To get a Fathom API key:
1. Log in to your Fathom account
2. Navigate to Settings > API
3. Generate a new API key

## Development

```bash
# Build the project
npm run build

# Run in development mode (with API key)
FATHOM_API_KEY="your-api-key" npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Usage

### Running the server

```bash
FATHOM_API_KEY="your-api-key" npm start
```

The server runs using stdio transport, which is ideal for use with MCP clients like Claude Desktop.

### Testing with MCP Inspector

You can test the server using the MCP Inspector:

```bash
FATHOM_API_KEY="your-api-key" npx @modelcontextprotocol/inspector node dist/index.js
```

## Available Tools

### list_meetings

List all meetings from Fathom with optional filtering and pagination.

**Input Schema:**
- `createdAfter` (string, optional): Filter meetings created after this ISO 8601 datetime
- `createdBefore` (string, optional): Filter meetings created before this ISO 8601 datetime
- `includeSummary` (boolean, optional): Include meeting summaries in the response
- `includeTranscript` (boolean, optional): Include meeting transcripts in the response
- `recordedBy` (string, optional): Filter by email of the person who recorded the meeting
- `calendarInvitees` (string, optional): Filter by calendar invitee email addresses
- `cursor` (string, optional): Pagination cursor for next/previous page

**Output:**
- `meetings` (array): Array of meeting objects with recording details
- `next_cursor` (string, nullable): Cursor for next page of results
- `previous_cursor` (string, nullable): Cursor for previous page of results

### get_summary

Get the summary for a specific Fathom meeting recording.

**Input Schema:**
- `recordingId` (string): The ID of the recording to get summary for

**Output:**
- `template_name` (string): Name of the summary template used
- `markdown_formatted` (string): The meeting summary in markdown format

### get_transcript

Get the transcript for a specific Fathom meeting recording.

**Input Schema:**
- `recordingId` (string): The ID of the recording to get transcript for

**Output:**
- `transcript` (array): Array of transcript items, each containing:
  - `speaker` (string): Name of the speaker
  - `text` (string): The spoken text
  - `start_time` (string): Start timestamp (HH:MM:SS)
  - `end_time` (string): End timestamp (HH:MM:SS)

## Available Resources

### fathom://status

A status resource showing whether the Fathom API client is properly initialized.

## Configuration for Claude Desktop

Add this to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fathom": {
      "command": "node",
      "args": ["/path/to/Fathom-mcp-server/dist/index.js"],
      "env": {
        "FATHOM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Tech Stack

- **Runtime**: Node.js
- **Package Manager**: NPM
- **Language**: TypeScript
- **Validation**: Zod
- **Linter/Formatter**: Biome
- **Testing**: Native Node.js test runner
- **MCP SDK**: @modelcontextprotocol/sdk

## API Reference

This server uses the Fathom API v1. For more information, visit:
- [Fathom API Documentation](https://developers.fathom.ai/)
- [Fathom API Overview](https://developers.fathom.ai/api-overview)

## License

MIT License. See the [LICENSE](./LICENSE) file for details.