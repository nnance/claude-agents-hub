#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CalendarManager } from "./calendar.js";

// Create the MCP server
const server = new McpServer({
	name: "apple-calendar-mcp-server",
	version: "1.0.0",
});

// Initialize Calendar manager
const calendarManager = new CalendarManager();

// Register list calendars tool
server.registerTool(
	"list_calendars",
	{
		title: "List Calendars",
		description: "List all available calendars in Apple Calendar",
		inputSchema: {},
		outputSchema: {
			calendars: z.array(z.string()),
		},
	},
	async () => {
		const calendars = await calendarManager.listCalendars();

		if (!calendars) {
			throw new Error("Failed to list calendars");
		}

		const output = { calendars };

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

// Register list events tool
server.registerTool(
	"list_events",
	{
		title: "List Calendar Events",
		description: "List events from a specific calendar within a date range",
		inputSchema: {
			calendarName: z
				.string()
				.optional()
				.describe("Name of the calendar to list events from (defaults to 'Calendar')"),
			days: z
				.number()
				.optional()
				.default(7)
				.describe("Number of days ahead to list events for (default: 7)"),
		},
		outputSchema: {
			events: z.array(
				z.object({
					summary: z.string(),
					startDate: z.string(),
					endDate: z.string(),
					calendar: z.string(),
				}),
			),
		},
	},
	async (args) => {
		const events = await calendarManager.listEvents(args.calendarName, args.days);

		if (!events) {
			throw new Error("Failed to list events");
		}

		const output = { events };

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

// Register search events tool
server.registerTool(
	"search_events",
	{
		title: "Search Calendar Events",
		description: "Search for events by query string in summary or description",
		inputSchema: {
			query: z.string().describe("Search query to match against event summary or description"),
			calendarName: z
				.string()
				.optional()
				.describe("Name of the calendar to search in (defaults to 'Calendar')"),
			days: z
				.number()
				.optional()
				.default(90)
				.describe("Number of days ahead to search within (default: 90)"),
		},
		outputSchema: {
			events: z.array(
				z.object({
					summary: z.string(),
					startDate: z.string(),
					endDate: z.string(),
					calendar: z.string(),
				}),
			),
		},
	},
	async (args) => {
		const events = await calendarManager.searchEvents(
			args.query,
			args.calendarName,
			args.days,
		);

		if (!events) {
			throw new Error("Failed to search events");
		}

		const output = { events };

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

// Register create event tool
server.registerTool(
	"create_event",
	{
		title: "Create Calendar Event",
		description: "Create a new event in the specified calendar",
		inputSchema: {
			calendarName: z.string().describe("Name of the calendar to create the event in"),
			title: z.string().describe("Title/summary of the event"),
			startDate: z.string().describe("Start date in AppleScript date format (e.g., 'January 1, 2025 10:00:00 AM')"),
			endDate: z.string().describe("End date in AppleScript date format (e.g., 'January 1, 2025 11:00:00 AM')"),
			description: z
				.string()
				.optional()
				.default("")
				.describe("Optional description for the event"),
		},
		outputSchema: {
			result: z.string(),
		},
	},
	async (args) => {
		const result = await calendarManager.createEvent(
			args.calendarName,
			args.title,
			args.startDate,
			args.endDate,
			args.description,
		);

		if (!result) {
			throw new Error("Failed to create event");
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

// Register delete event tool
server.registerTool(
	"delete_event",
	{
		title: "Delete Calendar Event",
		description: "Delete an event from the specified calendar by title",
		inputSchema: {
			calendarName: z.string().describe("Name of the calendar containing the event"),
			eventTitle: z.string().describe("Title of the event to delete"),
		},
		outputSchema: {
			result: z.string(),
		},
	},
	async (args) => {
		const result = await calendarManager.deleteEvent(args.calendarName, args.eventTitle);

		if (!result) {
			throw new Error("Failed to delete event");
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

// Register get today's events tool
server.registerTool(
	"get_today_events",
	{
		title: "Get Today's Events",
		description: "Get all events for today from the default calendar",
		inputSchema: {},
		outputSchema: {
			events: z.array(
				z.object({
					summary: z.string(),
					startDate: z.string(),
					endDate: z.string(),
					calendar: z.string(),
				}),
			),
		},
	},
	async () => {
		const events = await calendarManager.getTodayEvents();

		if (!events) {
			throw new Error("Failed to get today's events");
		}

		const output = { events };

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

// Register get event details tool
server.registerTool(
	"get_event_details",
	{
		title: "Get Event Details",
		description: "Get detailed information about a specific event",
		inputSchema: {
			calendarName: z.string().describe("Name of the calendar containing the event"),
			eventTitle: z.string().describe("Title of the event to get details for"),
		},
		outputSchema: {
			event: z.object({
				summary: z.string(),
				startDate: z.string(),
				endDate: z.string(),
				calendar: z.string(),
				description: z.string(),
				location: z.string(),
				url: z.string(),
			}),
		},
	},
	async (args) => {
		const event = await calendarManager.getEventDetails(
			args.calendarName,
			args.eventTitle,
		);

		if (!event) {
			throw new Error("Event not found");
		}

		const output = { event };

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

// Register a resource for Calendar status
server.registerResource(
	"calendar-status",
	"apple-calendar://status",
	{
		title: "Apple Calendar Status",
		description: "Current status of the Apple Calendar integration",
		mimeType: "text/plain",
	},
	async (uri) => ({
		contents: [
			{
				uri: uri.href,
				text: "Apple Calendar integration initialized and ready",
			},
		],
	}),
);

// Start the server with stdio transport
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Apple Calendar MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
