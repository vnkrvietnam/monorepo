/**
 * xml-parser.ts — Fast-XML-Parser helpers for ISO 20022 MX messages
 *
 * Thin wrappers around fast-xml-parser to provide consistent options
 * for building and parsing SWIFT MX (XML) messages.
 */

import { XMLBuilder, XMLParser, type X2jOptions, type XmlBuilderOptions } from "fast-xml-parser";

// ─── Shared parser / builder options ─────────────────────────────────────────

const PARSER_OPTIONS: X2jOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  cdataPropName: "__cdata",
};

const BUILDER_OPTIONS: XmlBuilderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
  suppressEmptyNode: true,
};

// ─── Singleton instances ──────────────────────────────────────────────────────

let _parser: XMLParser | null = null;
let _builder: XMLBuilder | null = null;

export function getParser(): XMLParser {
  if (!_parser) _parser = new XMLParser(PARSER_OPTIONS);
  return _parser;
}

export function getBuilder(): XMLBuilder {
  if (!_builder) _builder = new XMLBuilder(BUILDER_OPTIONS);
  return _builder;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse an ISO 20022 XML string to a plain object.
 *
 * @param xml - Raw XML string (e.g. pacs.008, camt.053)
 * @returns Parsed object with attribute prefix "@_"
 */
export function parseISO20022XML(xml: string): Record<string, unknown> {
  return getParser().parse(xml) as Record<string, unknown>;
}

/**
 * Build an ISO 20022 XML string from a plain object.
 *
 * @param obj - Plain object to serialize
 * @returns Well-formed XML string
 */
export function buildISO20022XML(obj: Record<string, unknown>): string {
  return getBuilder().build(obj) as string;
}

/**
 * Extract the `Document` element content from a full MX XML string.
 * Returns `undefined` if no `Document` element is found.
 */
export function extractDocument(xml: string): Record<string, unknown> | undefined {
  const parsed = parseISO20022XML(xml) as { Document?: Record<string, unknown> };
  return parsed.Document;
}

/**
 * Extract the ISO 20022 namespace from the `Document` element xmlns attribute.
 * E.g.: "urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"
 */
export function extractNamespace(xml: string): string | undefined {
  const match = xml.match(/xmlns="([^"]+)"/);
  return match?.[1];
}

/**
 * Determine the ISO 20022 message type from the namespace URI.
 * E.g.: "pacs.008.001.08" from "urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"
 */
export function extractMessageType(xml: string): string | undefined {
  const ns = extractNamespace(xml);
  if (!ns) return undefined;
  // Extract the last segment: pacs.008.001.08
  const parts = ns.split(":");
  return parts[parts.length - 1];
}
