import "dotenv/config";
import {
	query,
	type McpStdioServerConfig,
} from "@anthropic-ai/claude-agent-sdk";

// Parse the first command line argument as the prompt
const prompt = process.argv[2];

if (!prompt) {
	console.error("Error: Please provide a prompt as the first argument");
	console.error('Usage: npm start "Your prompt here"');
	process.exit(1);
}

const SYSTEM_PROMPT = `
You are an executive assistant AI agent with access to Apple Applications (Calendar, Notes) on the user's Mac. 
Use the provided tools to manage and retrieve information as needed to assist with the user's requests.

# Key Information

- Personal Information: Use Apple Note titled "Personal Information" for relevant personal details.
- Professional Information: Use Apple Note titled "Professional Information" for relevant professional details.
`;

const calendarServerConfig: McpStdioServerConfig = {
	type: "stdio",
	command: "node",
	args: ["../../mcp/apple-mcp-server/dist/calendar-server.js"],
	env: {
		APPLE_CALENDAR_NAME: process.env.APPLE_CALENDAR_NAME || "",
	},
};

const contactsServerConfig: McpStdioServerConfig = {
	type: "stdio",
	command: "node",
	args: ["../../mcp/apple-mcp-server/dist/contacts-server.js"],
};

const notesServerConfig: McpStdioServerConfig = {
	type: "stdio",
	command: "node",
	args: ["../../mcp/apple-mcp-server/dist/notes-server.js"],
};

const responseStream = query({
	prompt,
	options: {
		model: "claude-sonnet-4-5-20250929",
		systemPrompt: SYSTEM_PROMPT,
		mcpServers: {
			appleNotes: notesServerConfig,
			appleCalendar: calendarServerConfig,
			appleContacts: contactsServerConfig,
		},
		allowedTools: [
			"READ",
			"mcp__appleNotes__get_note_content",
			"mcp__appleNotes__search_notes",
			"mcp__appleNotes__create_note",
			"mcp__appleCalendar__create_event",
			"mcp__appleContacts__search_contacts",
			"mcp__appleContacts__get_contact",
		],
		maxTurns: 10,
		settingSources: ["project"], // Required to load CLAUDE.md from project
	},
});

// Process streaming responses
for await (const response of responseStream) {
	let sessionId = null;
	// The first message is a system init message with the session ID
	if (response.type === "system" && response.subtype === "init") {
		sessionId = response.session_id;
		console.log(`Session started with ID: ${sessionId}`);
		// You can save this ID for later resumption
	} else if (response.type === "result" && response.subtype === "success") {
		console.log(response.result);
	} else if (
		response.type === "assistant" &&
		response.message.content[0].type === "tool_use"
	) {
		console.log(`Using tool: ${response.message.content[0].name}`);
		console.log(JSON.stringify(response.message.content[0].input, null, 2));
	}
}
