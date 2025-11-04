#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FathomClient } from "./client";

const FATHOM_API_KEY = process.env.FATHOM_API_KEY;

// Create the MCP server
const server = new McpServer({
	name: "fathom-mcp-server",
	version: "1.0.0",
});

// Initialize Fathom client (will be null if API key is not provided)
let fathomClient: FathomClient | null = null;

try {
	if (FATHOM_API_KEY) {
		fathomClient = new FathomClient(FATHOM_API_KEY);
	}
} catch (error) {
	console.error("Warning: Failed to initialize Fathom client:", error);
}

// Helper to check if client is available
function ensureFathomClient(): FathomClient {
	if (!fathomClient) {
		throw new Error(
			"Fathom API key not configured. Please set FATHOM_API_KEY environment variable.",
		);
	}
	return fathomClient;
}

// Register list meetings tool
server.registerTool(
	"list_meetings",
	{
		title: "List Meetings",
		description:
			"List all meetings from Fathom with optional filtering by date range, participants, and pagination",
		inputSchema: {
			createdAfter: z
				.string()
				.datetime()
				.optional()
				.describe(
					"ISO 8601 timestamp to filter meetings created after this date",
				),
			createdBefore: z
				.string()
				.datetime()
				.optional()
				.describe(
					"ISO 8601 timestamp to filter meetings created before this date",
				),
			includeSummary: z
				.boolean()
				.optional()
				.default(false)
				.describe("Include meeting summaries in the response"),
			includeTranscript: z
				.boolean()
				.optional()
				.default(false)
				.describe("Include transcripts in the response"),
			includeActionItems: z
				.boolean()
				.optional()
				.default(false)
				.describe("Include action items in the response"),
			calendarInvitees: z
				.array(z.string().email())
				.optional()
				.describe("Filter by calendar invitee email addresses"),
			recordedBy: z
				.array(z.string().email())
				.optional()
				.describe("Filter by recorder email addresses"),
			cursor: z
				.string()
				.optional()
				.describe("Pagination cursor for fetching next page of results"),
		},
		outputSchema: {
			limit: z.number(),
			next_cursor: z.string().nullable(),
			items: z.array(z.unknown()),
		},
	},
	async (args) => {
		const client = ensureFathomClient();
		const response = await client.listMeetings(args);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(response, null, 2),
				},
			],
			structuredContent: JSON.parse(JSON.stringify(response)),
		};
	},
);

// Register get summary tool
server.registerTool(
	"get_summary",
	{
		title: "Get Meeting Summary",
		description: "Get the summary for a specific Fathom meeting recording",
		inputSchema: {
			recordingId: z
				.number()
				.describe("The ID of the recording to get summary for"),
		},
		outputSchema: {
			template_name: z.string(),
			markdown_formatted: z.string(),
		},
	},
	async ({ recordingId }) => {
		const client = ensureFathomClient();
		const summary = await client.getSummary(recordingId);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(summary, null, 2),
				},
			],
			structuredContent: JSON.parse(JSON.stringify(summary)),
		};
	},
);

// Register get transcript tool
server.registerTool(
	"get_transcript",
	{
		title: "Get Meeting Transcript",
		description: "Get the transcript for a specific Fathom meeting recording",
		inputSchema: {
			recordingId: z
				.number()
				.describe("The ID of the recording to get transcript for"),
		},
		outputSchema: {
			transcript: z.array(
				z.object({
					speaker: z.string(),
					text: z.string(),
					start_time: z.string(),
					end_time: z.string(),
				}),
			),
		},
	},
	async ({ recordingId }) => {
		const client = ensureFathomClient();
		const transcript = await client.getTranscript(recordingId);

		const output = { transcript };

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

// Register download transcript tool
server.registerTool(
	"download_transcript",
	{
		title: "Download Meeting Transcript",
		description:
			"Download the transcript for a specific Fathom meeting recording",
		inputSchema: {
			recordingId: z
				.number()
				.describe("The recording ID to get the transcript for"),
			filePath: z.string().describe("Path to write the transcript file"),
		},
		outputSchema: {
			result: z.string().describe("Success message with file path"),
		},
	},
	async (args) => {
		const client = ensureFathomClient();
		const result = await client.downloadTranscript(
			args.recordingId,
			args.filePath,
		);

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

// Register a resource for API status
server.registerResource(
	"fathom-status",
	"fathom://status",
	{
		title: "Fathom API Status",
		description: "Current status of the Fathom API connection",
		mimeType: "text/plain",
	},
	async (uri) => ({
		contents: [
			{
				uri: uri.href,
				text: fathomClient
					? "Fathom API client initialized and ready"
					: "Fathom API client not initialized - FATHOM_API_KEY environment variable not set",
			},
		],
	}),
);

// Start the server with stdio transport
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Fathom MCP Server running on stdio");
	console.error(
		`Fathom API client: ${fathomClient ? "initialized" : "not initialized"}`,
	);
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
