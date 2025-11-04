import { writeFile } from "node:fs/promises";
import { z } from "zod";

// API Configuration
const FATHOM_API_BASE = "https://api.fathom.ai/external/v1";

// ==================== TypeScript Interfaces ====================

/**
 * Transcript item speaker details
 */
export interface TranscriptSpeaker {
	display_name: string;
	matched_calendar_invitee_email: string | null;
}

/**
 * Single transcript item with speaker, text, and timestamp
 */
export interface TranscriptItem {
	speaker: TranscriptSpeaker;
	text: string;
	timestamp: string; // HH:MM:SS format
}

/**
 * Meeting summary with template and markdown content
 */
export interface MeetingSummary {
	template_name: string | null;
	markdown_formatted: string | null;
}

/**
 * Calendar invitee information
 */
export interface CalendarInvitee {
	name: string;
	email: string;
	email_domain: string;
	is_external: boolean;
	matched_speaker_display_name: string | null;
}

/**
 * Fathom user information
 */
export interface FathomUser {
	name: string;
	email: string;
	email_domain: string;
	team: string | null;
}

/**
 * Action item from meeting
 */
export interface ActionItem {
	description: string;
	user_generated: boolean;
	completed: boolean;
	recording_timestamp: string | null;
	recording_playback_url: string | null;
	assignee: {
		name: string;
		email: string;
		team: string | null;
	} | null;
}

/**
 * CRM match for contacts, companies, or deals
 */
export interface CRMMatches {
	contacts: unknown[];
	companies: unknown[];
	deals: unknown[];
	error: string | null;
}

/**
 * Complete meeting object returned from listMeetings
 */
export interface Meeting {
	title: string;
	meeting_title: string | null;
	recording_id: number;
	url: string;
	share_url: string;
	created_at: string;
	scheduled_start_time: string;
	scheduled_end_time: string;
	recording_start_time: string;
	recording_end_time: string;
	calendar_invitees_domains_type: "only_internal" | "one_or_more_external";
	transcript_language: string;
	transcript: TranscriptItem[] | null;
	default_summary: MeetingSummary | null;
	action_items: ActionItem[] | null;
	calendar_invitees: CalendarInvitee[];
	recorded_by: FathomUser;
	crm_matches: CRMMatches | null;
}

/**
 * Response from listMeetings endpoint
 */
export interface ListMeetingsResponse {
	limit: number;
	next_cursor: string | null;
	items: Meeting[];
}

// ==================== Zod Schemas ====================

/**
 * Zod schema for transcript speaker
 */
const TranscriptSpeakerSchema = z.object({
	display_name: z.string(),
	matched_calendar_invitee_email: z.string().email().nullable(),
});

/**
 * Zod schema for transcript item
 */
const TranscriptItemSchema = z.object({
	speaker: TranscriptSpeakerSchema,
	text: z.string(),
	timestamp: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
});

/**
 * Zod schema for meeting summary
 */
const MeetingSummarySchema = z.object({
	template_name: z.string().nullable(),
	markdown_formatted: z.string().nullable(),
});

/**
 * Zod schema for calendar invitee
 */
const CalendarInviteeSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	email_domain: z.string(),
	is_external: z.boolean(),
	matched_speaker_display_name: z.string().nullable(),
});

/**
 * Zod schema for Fathom user
 */
const FathomUserSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	email_domain: z.string(),
	team: z.string().nullable(),
});

/**
 * Zod schema for action item
 */
const ActionItemSchema = z.object({
	description: z.string(),
	user_generated: z.boolean(),
	completed: z.boolean(),
	recording_timestamp: z.string().nullable(),
	recording_playback_url: z.string().url().nullable(),
	assignee: z
		.object({
			name: z.string(),
			email: z.string().email(),
			team: z.string().nullable(),
		})
		.nullable(),
});

/**
 * Zod schema for CRM matches
 */
const CRMMatchesSchema = z.object({
	contacts: z.array(z.unknown()),
	companies: z.array(z.unknown()),
	deals: z.array(z.unknown()),
	error: z.string().nullable(),
});

/**
 * Zod schema for complete meeting object
 */
const MeetingSchema = z.object({
	title: z.string(),
	meeting_title: z.string().nullable(),
	recording_id: z.number(),
	url: z.string().url(),
	share_url: z.string().url(),
	created_at: z.string().datetime(),
	scheduled_start_time: z.string().datetime(),
	scheduled_end_time: z.string().datetime(),
	recording_start_time: z.string().datetime(),
	recording_end_time: z.string().datetime(),
	calendar_invitees_domains_type: z.enum([
		"only_internal",
		"one_or_more_external",
	]),
	transcript_language: z.string(),
	transcript: z.array(TranscriptItemSchema).nullable(),
	default_summary: MeetingSummarySchema.nullable(),
	action_items: z.array(ActionItemSchema).nullable(),
	calendar_invitees: z.array(CalendarInviteeSchema),
	recorded_by: FathomUserSchema,
	crm_matches: CRMMatchesSchema.nullable(),
});

/**
 * Zod schema for listMeetings response
 */
const ListMeetingsResponseSchema = z.object({
	limit: z.number(),
	next_cursor: z.string().nullable(),
	items: z.array(MeetingSchema),
});

/**
 * Zod schema for getSummary response
 */
const GetSummaryResponseSchema = z.object({ summary: MeetingSummarySchema });
type GetSummaryResponse = z.infer<typeof GetSummaryResponseSchema>;

/**
 * Zod schema for getTranscript response (array of transcript items)
 */
const GetTranscriptResponseSchema = z.object({
	transcript: z.array(TranscriptItemSchema).optional(),
});
type GetTranscriptResponse = z.infer<typeof GetTranscriptResponseSchema>;

// ==================== FathomClient Class ====================

/**
 * Manages interactions with the Fathom API
 */
export class FathomClient {
	private apiKey: string;
	private baseUrl: string = FATHOM_API_BASE;

	constructor(apiKey: string) {
		if (!apiKey) {
			throw new Error("API key is required for FathomClient");
		}
		this.apiKey = apiKey;
	}

	/**
	 * Make an authenticated HTTP request to the Fathom API
	 * @param endpoint - API endpoint path
	 * @param options - Fetch options
	 * @returns Parsed JSON response
	 */
	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const headers = {
			"X-Api-Key": this.apiKey,
			"Content-Type": "application/json",
			...options.headers,
		};

		try {
			const response = await fetch(url, {
				...options,
				headers,
			});

			if (!response.ok) {
				const errorBody = await response.text();
				throw new Error(
					`Fathom API error ${response.status}: ${response.statusText} - ${errorBody}`,
				);
			}

			return (await response.json()) as T;
		} catch (error) {
			console.error(`Error making request to ${url}:`, error);
			throw error;
		}
	}

	/**
	 * List meetings with optional filters
	 * @param options - Filter options for listing meetings
	 * @returns List of meetings matching the filters
	 */
	async listMeetings(options?: {
		createdAfter?: string;
		createdBefore?: string;
		includeSummary?: boolean;
		includeTranscript?: boolean;
		includeActionItems?: boolean;
		calendarInvitees?: string[];
		recordedBy?: string[];
		cursor?: string;
	}): Promise<ListMeetingsResponse> {
		const params = new URLSearchParams();

		if (options?.createdAfter) {
			params.append("created_after", options.createdAfter);
		}
		if (options?.createdBefore) {
			params.append("created_before", options.createdBefore);
		}
		if (options?.includeSummary) {
			params.append("include_summary", "true");
		}
		if (options?.includeTranscript) {
			params.append("include_transcript", "true");
		}
		if (options?.includeActionItems) {
			params.append("include_action_items", "true");
		}
		if (options?.calendarInvitees) {
			for (const email of options.calendarInvitees) {
				params.append("calendar_invitees[]", email);
			}
		}
		if (options?.recordedBy) {
			for (const email of options.recordedBy) {
				params.append("recorded_by[]", email);
			}
		}
		if (options?.cursor) {
			params.append("cursor", options.cursor);
		}

		const endpoint = `/meetings${params.toString() ? `?${params.toString()}` : ""}`;
		const response = await this.makeRequest<unknown>(endpoint);

		return ListMeetingsResponseSchema.parse(response);
	}

	/**
	 * Get summary for a specific recording
	 * @param recordingId - The recording ID
	 * @returns Meeting summary with markdown content
	 */
	async getSummary(recordingId: number): Promise<GetSummaryResponse> {
		const endpoint = `/recordings/${recordingId}/summary`;
		const response = await this.makeRequest<GetSummaryResponse>(endpoint);

		return GetSummaryResponseSchema.parse(response);
	}

	/**
	 * Download summary for a specific recording to a file
	 * @param recordingId - The recording ID
	 * @param filePath - Path to write the summary file
	 * @returns Success message with file path
	 */
	async downloadSummary(
		recordingId: number,
		filePath: string,
	): Promise<string> {
		const summaryResponse = await this.getSummary(recordingId);
		const content = summaryResponse.summary.markdown_formatted ?? "";

		await writeFile(filePath, content, "utf-8");

		return `Summary downloaded to ${filePath}`;
	}

	/**
	 * Get transcript for a specific recording
	 * @param recordingId - The recording ID
	 * @returns Array of transcript items with speaker information and timestamps
	 */
	async getTranscript(recordingId: number): Promise<GetTranscriptResponse> {
		const endpoint = `/recordings/${recordingId}/transcript`;
		const response = await this.makeRequest<GetTranscriptResponse>(endpoint);

		return GetTranscriptResponseSchema.parse(response);
	}

	/**
	 * Download transcript for a specific recording to a file
	 * @param recordingId - The recording ID
	 * @param filePath - Path to write the transcript file
	 * @returns Success message with file path
	 */
	async downloadTranscript(
		recordingId: number,
		filePath: string,
	): Promise<string> {
		const transcriptResponse = await this.getTranscript(recordingId);
		const transcript = transcriptResponse.transcript ?? [];

		// Format transcript as readable text
		const formattedLines = transcript.map((item) => {
			const speaker = item.speaker.display_name;
			const timestamp = item.timestamp;
			const text = item.text;
			return `[${timestamp}] ${speaker}: ${text}`;
		});

		const content = formattedLines.join("\n");
		await writeFile(filePath, content, "utf-8");

		return `Transcript downloaded to ${filePath}`;
	}
}
