/**
 * Core domain model for the Cultural & Trend Intelligence Calendar.
 *
 * Every event tracked by the system — whether curated by an analyst or
 * appended programmatically by the ingestion pipeline — conforms to the
 * `CulturalEvent` contract below.
 */

export type CategoryId =
  | "art"
  | "fashion"
  | "entertainment"
  | "innovation"
  | "pop-culture";

/**
 * Confidence level on the specific detail (lineup, cast, dates) attached to an
 * event. Far-out events are often "rumored" or "projected" before they firm up
 * into "confirmed" — surfacing this keeps the intelligence honest.
 */
export type EventStatus = "confirmed" | "rumored" | "projected";

export interface CulturalEvent {
  id: string;
  title: string;
  category: CategoryId;
  /** e.g., "Independent Designer", "Streaming Series", "Brand Collab" */
  subCategory: string;
  /** ISO-8601 date string (YYYY-MM-DD). */
  startDate: string;
  /** Optional ISO-8601 end date for multi-day windows. */
  endDate?: string;
  /** Strategic weight on a 1-10 scale. */
  impactScore: number;
  /** Key actors, designers, parent corps, or agencies involved. */
  commercialDrivers: string[];
  /** Analytical insight on why this matters for co-branding. */
  partnershipAngle: string;
  /** Supporting reference links. */
  sourceUrls: string[];
  /**
   * Provenance flag. Curated events are protected from being overwritten
   * by the automated sync pipeline; ingested events may be refreshed.
   */
  source?: "curated" | "ingested";
  /**
   * ISO date the event/news broke. Powers the "Recent Announcements" feed,
   * letting far-future events surface as soon as they're announced.
   */
  announcedDate?: string;
  /** Named, niche detail: festival headliners, film cast, show creators. */
  headliners?: string[];
  /** Short editorial note with the surrounding context that matters. */
  description?: string;
  /** Confidence in the specific detail above. Defaults to "confirmed". */
  status?: EventStatus;
}

/** Payload accepted when creating an event (id + source are assigned server-side). */
export type NewCulturalEvent = Omit<CulturalEvent, "id" | "source"> &
  Partial<Pick<CulturalEvent, "id" | "source">>;
