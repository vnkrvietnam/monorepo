import { XMLParser, XMLBuilder } from 'fast-xml-parser';

/** Options shared across all XML parse operations. */
const PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
};

/** Options shared across all XML build operations. */
const BUILDER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
};

/**
 * Bidirectional XML ↔ JSON parser engine for ISO 20022 MX messages.
 *
 * Wraps `fast-xml-parser` with consistent options so that all SDK modules
 * use the same serialisation behaviour.
 *
 * @example
 * ```ts
 * const parser = new Iso20022Parser();
 * const json = await parser.parseXmlToJson(xmlString);
 * const xml  = await parser.parseJsonToXml(json);
 * ```
 */
export class Iso20022Parser {
  private readonly xmlParser: XMLParser;
  private readonly xmlBuilder: XMLBuilder;

  constructor() {
    this.xmlParser = new XMLParser(PARSER_OPTIONS);
    this.xmlBuilder = new XMLBuilder(BUILDER_OPTIONS);
  }

  /**
   * Parses an ISO 20022 XML string into a plain JavaScript object.
   *
   * The returned object mirrors the XML document structure including
   * attributes (prefixed with `@_`) and element values.
   *
   * @param xml Well-formed ISO 20022 XML string.
   * @returns   Plain JavaScript object representation of the XML.
   * @throws    `Error` if the XML is malformed.
   */
  async parseXmlToJson(xml: string): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = this.xmlParser.parse(xml);
    return result;
  }

  /**
   * Serialises a plain JavaScript object back into an ISO 20022 XML string.
   *
   * @param json Object produced by `parseXmlToJson` or constructed manually.
   * @returns    XML string representation of the object.
   */
  async parseJsonToXml(json: Record<string, unknown>): Promise<string> {
    const xml: string = this.xmlBuilder.build(json);
    return xml;
  }
}
