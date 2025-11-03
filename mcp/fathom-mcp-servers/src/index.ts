#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Fathom API Configuration
const FATHOM_API_BASE = "https://api.fathom.video";
const FATHOM_API_KEY = process.env.FATHOM_API_KEY;

// Zod Schemas for API Responses
const TranscriptItemSchema = z.object({
	speaker: z.string(),
	text: z.string(),
	start_time: z.string(),
	end_time: z.string(),
});

const MeetingSummarySchema = z.object({
	template_name: z.string(),
	markdown_formatted: z.string(),
});

const MeetingSchema = z.object({
	recording_id: z.string(),
	title: z.string().nullable(),
	start_time: z.string(),
	end_time: z.string().nullable(),
	duration_seconds: z.number().nullable(),
	recording_url: z.string().nullable(),
	share_url: z.string().nullable(),
	default_summary: MeetingSummarySchema.nullable().optional(),
	transcript: z.array(TranscriptItemSchema).optional(),
});

const ListMeetingsResponseSchema = z.object({
	meetings: z.array(MeetingSchema),
	next_cursor: z.string().nullable().optional(),
	previous_cursor: z.string().nullable().optional(),
});

// Type definitions
type TranscriptItem = z.infer<typeof TranscriptItemSchema>;
type MeetingSummary = z.infer<typeof MeetingSummarySchema>;
type ListMeetingsResponse = z.infer<typeof ListMeetingsResponseSchema>;

// Fathom API Client
class FathomClient {
	private apiKey: string;
	private baseUrl: string;

	constructor(apiKey: string, baseUrl = FATHOM_API_BASE) {
		if (!apiKey) {
			throw new Error("FATHOM_API_KEY environment variable is required");
		}
		this.apiKey = apiKey;
		this.baseUrl = baseUrl;
	}

	private async makeRequest(
		endpoint: string,
		options: RequestInit = {},
	): Promise<unknown> {
		const url = `${this.baseUrl}${endpoint}`;
		const headers = {
			"X-Api-Key": this.apiKey,
			"Content-Type": "application/json",
			...options.headers,
		};

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Fathom API error (${response.status}): ${errorText}`);
		}

		return response.json();
	}

	async listMeetings(params: {
		createdAfter?: string | undefined;
		createdBefore?: string | undefined;
		includeSummary?: boolean | undefined;
		includeTranscript?: boolean | undefined;
		recordedBy?: string | undefined;
		calendarInvitees?: string | undefined;
		cursor?: string | undefined;
	}): Promise<ListMeetingsResponse> {
		const queryParams = new URLSearchParams();

		if (params?.createdAfter)
			queryParams.append("created_after", params.createdAfter);
		if (params?.createdBefore)
			queryParams.append("created_before", params.createdBefore);
		if (params?.includeSummary !== undefined)
			queryParams.append("include_summary", params.includeSummary.toString());
		if (params?.includeTranscript !== undefined)
			queryParams.append(
				"include_transcript",
				params.includeTranscript.toString(),
			);
		if (params?.recordedBy)
			queryParams.append("recorded_by", params.recordedBy);
		if (params?.calendarInvitees)
			queryParams.append("calendar_invitees", params.calendarInvitees);
		if (params?.cursor) queryParams.append("cursor", params.cursor);

		const queryString = queryParams.toString();
		const endpoint = `/external/v1/meetings${queryString ? `?${queryString}` : ""}`;

		const data = await this.makeRequest(endpoint);
		return ListMeetingsResponseSchema.parse(data);
	}

	async getSummary(recordingId: string): Promise<MeetingSummary> {
		const data = await this.makeRequest(
			`/recordings/${recordingId}/summary`,
		);
		return MeetingSummarySchema.parse(data);
	}

	async getTranscript(recordingId: string): Promise<TranscriptItem[]> {
		const data = await this.makeRequest(
			`/recordings/${recordingId}/transcript`,
		);
		return z.array(TranscriptItemSchema).parse(data);
	}
}

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
				.optional()
				.describe("Filter meetings created after this ISO 8601 datetime"),
			createdBefore: z
				.string()
				.optional()
				.describe("Filter meetings created before this ISO 8601 datetime"),
			includeSummary: z
				.boolean()
				.optional()
				.describe("Include meeting summaries in the response"),
			includeTranscript: z
				.boolean()
				.optional()
				.describe("Include meeting transcripts in the response"),
			recordedBy: z
				.string()
				.optional()
				.describe("Filter by email of the person who recorded the meeting"),
			calendarInvitees: z
				.string()
				.optional()
				.describe("Filter by calendar invitee email addresses"),
			cursor: z
				.string()
				.optional()
				.describe("Pagination cursor for next/previous page"),
		},
		outputSchema: {
			meetings: z.array(z.unknown()),
			next_cursor: z.string().nullable().optional(),
			previous_cursor: z.string().nullable().optional(),
		},
	},
	async (params) => {
		const client = ensureFathomClient();
		const response = await client.listMeetings(params);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(response, null, 2),
				},
			],
			structuredContent: response,
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
				.string()
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
			structuredContent: summary,
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
				.string()
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
			structuredContent: output,
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