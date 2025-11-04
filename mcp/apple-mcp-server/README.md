# Apple MCP Server

Apple macOS integration MCP servers - A collection of Model Context Protocol (MCP) servers that provide access to native macOS applications: Calendar, Contacts, and Notes.

## Overview

This package provides three separate MCP servers for macOS:
- **Calendar Server** - Manage calendar events, search, create, and delete events
- **Contacts Server** - Search, create, and manage contacts
- **Notes Server** - Create, search, and edit notes

Each server uses AppleScript to interact with native macOS applications, providing:
- Full CRUD operations for each application
- Search and filtering capabilities
- TypeScript with strict type checking and Zod validation
- Biome for linting and formatting
- Native Node.js test runner for tests

## Requirements

- **macOS** - These servers only work on macOS as they use AppleScript
- **Node.js** - Version 18 or higher
- **Permissions** - The Terminal or application running these servers needs permission to:
  - Control Calendar.app
  - Control Contacts.app
  - Control Notes.app

macOS will prompt for these permissions on first use.

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

- `APPLE_CALENDAR_NAME` (optional): Default calendar name to use (defaults to "Calendar")

```bash
export APPLE_CALENDAR_NAME="Work"
```

## Development

```bash
# Build the project
npm run build

# Run individual servers in development mode
npm run dev:calendar
npm run dev:contacts
npm run dev:notes

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

### Running the servers

Each server runs independently using stdio transport:

```bash
# Calendar server
npm run start:calendar

# Contacts server
npm run start:contacts

# Notes server
npm run start:notes
```

### Testing with MCP Inspector

You can test each server using the MCP Inspector:

```bash
# Calendar server
npx @modelcontextprotocol/inspector node dist/calendar-server.js

# Contacts server
npx @modelcontextprotocol/inspector node dist/contacts-server.js

# Notes server
npx @modelcontextprotocol/inspector node dist/notes-server.js
```

## Available Tools

### Calendar Server Tools

#### list_events

List events from a specific calendar within a date range.

**Input Schema:**
- `calendarName` (string, optional): Name of the calendar (defaults to "Calendar")
- `days` (number, optional): Number of days ahead to list events for (default: 7)

**Output:**
- `events` (array): Array of event objects with:
  - `summary` (string): Event title
  - `startDate` (string): Start date and time
  - `endDate` (string): End date and time
  - `calendar` (string): Calendar name

#### search_events

Search for events by query string in summary or description.

**Input Schema:**
- `query` (string): Search query to match against event summary or description
- `calendarName` (string, optional): Name of the calendar to search in
- `days` (number, optional): Number of days ahead to search within (default: 90)

**Output:**
- `events` (array): Array of matching event objects

#### create_event

Create a new event in the specified calendar.

**Input Schema:**
- `calendarName` (string): Name of the calendar to create the event in
- `title` (string): Title/summary of the event
- `startDate` (string): Start date in AppleScript format (e.g., "January 1, 2025 10:00:00 AM")
- `endDate` (string): End date in AppleScript format
- `description` (string, optional): Optional description for the event

**Output:**
- `result` (string): Success message

#### delete_event

Delete an event from the specified calendar by title.

**Input Schema:**
- `calendarName` (string): Name of the calendar containing the event
- `eventTitle` (string): Title of the event to delete

**Output:**
- `result` (string): Success or error message

#### get_today_events

Get all events for today from the default calendar.

**Input Schema:**
- None

**Output:**
- `events` (array): Array of today's event objects

#### get_event_details

Get detailed information about a specific event.

**Input Schema:**
- `calendarName` (string): Name of the calendar containing the event
- `eventTitle` (string): Title of the event to get details for

**Output:**
- `event` (object): Event details including:
  - `summary` (string): Event title
  - `startDate` (string): Start date and time
  - `endDate` (string): End date and time
  - `calendar` (string): Calendar name
  - `description` (string): Event description
  - `location` (string): Event location
  - `url` (string): Event URL

### Contacts Server Tools

#### search_contacts

Search for contacts by name or organization.

**Input Schema:**
- `query` (string): Search query to match against contact name or organization

**Output:**
- `contacts` (array): Array of matching contact objects with:
  - `id` (string): Contact ID
  - `name` (string): Contact name
  - `emails` (array): Email addresses
  - `phones` (array): Phone numbers
  - `organization` (string, optional): Organization name
  - `birthday` (string, optional): Birthday

#### create_contact

Create a new contact in the Contacts app.

**Input Schema:**
- `name` (string): Full name of the contact
- `email` (string, optional): Email address
- `phone` (string, optional): Phone number
- `organization` (string, optional): Organization/Company name
- `birthday` (string, optional): Birthday in AppleScript date format

**Output:**
- `result` (string): Success message

#### list_contacts

List all contacts from the Contacts app.

**Input Schema:**
- None

**Output:**
- `contacts` (array): Array of all contact objects

#### get_contact

Get details for a specific contact by name.

**Input Schema:**
- `contactName` (string): Full name of the contact to retrieve

**Output:**
- `contact` (object): Contact details

#### delete_contact

Delete a contact by name.

**Input Schema:**
- `contactName` (string): Full name of the contact to delete

**Output:**
- `result` (string): Success or error message

### Notes Server Tools

#### search_notes

Search for notes by query string in title or body.

**Input Schema:**
- `query` (string): Search query to match against note title or body

**Output:**
- `notes` (array): Array of matching note objects with:
  - `id` (string): Note ID
  - `name` (string): Note title
  - `body` (string): Note content

#### create_note

Create a new note in the Notes app.

**Input Schema:**
- `title` (string): Title of the note
- `body` (string, optional): Body content of the note

**Output:**
- `result` (string): Success message

#### edit_note

Edit the body content of an existing note.

**Input Schema:**
- `noteTitle` (string): Title of the note to edit
- `newBody` (string): New body content for the note

**Output:**
- `result` (string): Success or error message

#### list_notes

List all notes from the Notes app.

**Input Schema:**
- None

**Output:**
- `notes` (array): Array of all note objects

#### get_note_content

Get the full content of a specific note by title.

**Input Schema:**
- `noteTitle` (string): Title of the note to retrieve

**Output:**
- `content` (string): The note's body content

## Available Resources

### apple-calendar://calendars

List all available calendars in Apple Calendar.

**Returns:**
- `calendars` (array): Array of calendar names

### apple-calendar://status

A status resource showing the Calendar integration status.

### apple-contacts://status

A status resource showing the Contacts integration status.

### apple-notes://status

A status resource showing the Notes integration status.

## Configuration for Claude Desktop

Add this to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "apple-calendar": {
      "command": "node",
      "args": ["/path/to/apple-mcp-server/dist/calendar-server.js"],
      "env": {
        "APPLE_CALENDAR_NAME": "Calendar"
      }
    },
    "apple-contacts": {
      "command": "node",
      "args": ["/path/to/apple-mcp-server/dist/contacts-server.js"]
    },
    "apple-notes": {
      "command": "node",
      "args": ["/path/to/apple-mcp-server/dist/notes-server.js"]
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
- **Automation**: AppleScript via osascript

## Security Considerations

These servers execute AppleScript commands to interact with macOS applications. Be aware that:
- User input is embedded in AppleScript strings
- Special characters in user input could potentially break scripts
- Always validate and sanitize input when using these tools programmatically
- Grant permissions only to trusted applications

## Limitations

- **macOS only** - Will not work on Windows or Linux
- **String matching** - Event and contact deletion uses exact title/name matching
- **Single calendar operations** - Some operations work on one calendar at a time
- **No undo** - Delete operations are permanent
- **Date format** - Uses AppleScript date format which can be particular about formatting

## Troubleshooting

### Permission Denied Errors

If you see permission errors, make sure:
1. The Terminal or app running the server has Automation permissions
2. Go to System Settings > Privacy & Security > Automation
3. Enable permissions for Calendar, Contacts, and Notes

### AppleScript Errors

Common issues:
- **Calendar/Contact/Note not found**: Ensure exact name matching
- **Date format errors**: Use AppleScript date format: "Month Day, Year HH:MM:SS AM/PM"
- **Special characters**: Some characters may need escaping in AppleScript strings

## License

MIT License. See the [LICENSE](./LICENSE) file for details.
