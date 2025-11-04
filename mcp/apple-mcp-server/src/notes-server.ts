#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { NotesManager } from "./notes.js";

// Create the MCP server
const server = new McpServer({
	name: "apple-notes-mcp-server",
	version: "1.0.0",
});

// Initialize Notes manager
const notesManager = new NotesManager();

// Register search notes tool
server.registerTool(
	"search_notes",
	{
		title: "Search Notes",
		description: "Search for notes by query string in title or body",
		inputSchema: {
			query: z.string().describe("Search query to match against note title or body"),
		},
		outputSchema: {
			notes: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					body: z.string(),
				}),
			),
		},
	},
	async (args) => {
		const notes = await notesManager.searchNotes(args.query);

		if (!notes) {
			throw new Error("Failed to search notes");
		}

		const output = { notes };

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(output, null, 2),
				},
			],
			structuredContent: JSON.parse(JSON.stringify(output)),
		};
	},
);

// Register create note tool
server.registerTool(
	"create_note",
	{
		title: "Create Note",
		description: "Create a new note in the Notes app",
		inputSchema: {
			title: z.string().describe("Title of the note"),
			body: z
				.string()
				.optional()
				.default("")
				.describe("Body content of the note"),
		},
		outputSchema: {
			result: z.string(),
		},
	},
	async (args) => {
		const result = await notesManager.createNote(args.title, args.body);

		if (!result) {
			throw new Error("Failed to create note");
		}

		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
			structuredContent: { result },
		};
	},
);

// Register edit note tool
server.registerTool(
	"edit_note",
	{
		title: "Edit Note",
		description: "Edit the body content of an existing note",
		inputSchema: {
			noteTitle: z.string().describe("Title of the note to edit"),
			newBody: z.string().describe("New body content for the note"),
		},
		outputSchema: {
			result: z.string(),
		},
	},
	async (args) => {
		const result = await notesManager.editNote(args.noteTitle, args.newBody);

		if (!result) {
			throw new Error("Failed to edit note");
		}

		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
			structuredContent: { result },
		};
	},
);

// Register list notes tool
server.registerTool(
	"list_notes",
	{
		title: "List All Notes",
		description: "List all notes from the Notes app",
		inputSchema: {},
		outputSchema: {
			notes: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					body: z.string(),
				}),
			),
		},
	},
	async () => {
		const notes = await notesManager.listNotes();

		if (!notes) {
			throw new Error("Failed to list notes");
		}

		const output = { notes };

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(output, null, 2),
				},
			],
			structuredContent: JSON.parse(JSON.stringify(output)),
		};
	},
);

// Register get note content tool
server.registerTool(
	"get_note_content",
	{
		title: "Get Note Content",
		description: "Get the full content of a specific note by title",
		inputSchema: {
			noteTitle: z.string().describe("Title of the note to retrieve"),
		},
		outputSchema: {
			content: z.string(),
		},
	},
	async (args) => {
		const content = await notesManager.getNoteContent(args.noteTitle);

		if (!content) {
			throw new Error("Failed to get note content");
		}

		const output = { content };

		return {
			content: [
				{
					type: "text",
					text: content,
				},
			],
			structuredContent: output,
		};
	},
);

// Register a resource for Notes status
server.registerResource(
	"notes-status",
	"apple-notes://status",
	{
		title: "Apple Notes Status",
		description: "Current status of the Apple Notes integration",
		mimeType: "text/plain",
	},
	async (uri) => ({
		contents: [
			{
				uri: uri.href,
				text: "Apple Notes integration initialized and ready",
			},
		],
	}),
);

// Start the server with stdio transport
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Apple Notes MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
