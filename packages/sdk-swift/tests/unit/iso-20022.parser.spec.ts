import { Iso20022Parser } from '../../src/generators/iso-20022.parser';

/** Minimal pacs.008 XML snippet used across multiple tests. */
const MINIMAL_PACS008_XML = `
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>MSG-001</MsgId>
      <CreDtTm>2024-07-01T12:00:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>1000.00</CtrlSum>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>INSTR-001</InstrId>
        <EndToEndId>E2E-001</EndToEndId>
        <UETR>550e8400-e29b-41d4-a716-446655440000</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="USD">1000.00</IntrBkSttlmAmt>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
`.trim();

/** Minimal JSON object for XML serialisation tests. */
const MINIMAL_JSON: Record<string, unknown> = {
  Document: {
    '@_xmlns': 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08',
    FIToFICstmrCdtTrf: {
      GrpHdr: {
        MsgId: 'MSG-001',
        CreDtTm: '2024-07-01T12:00:00',
        NbOfTxs: 1,
        CtrlSum: 1000.0,
      },
    },
  },
};

describe('Iso20022Parser', () => {
  let parser: Iso20022Parser;

  beforeEach(() => {
    parser = new Iso20022Parser();
  });

  // ─── parseXmlToJson() ────────────────────────────────────────────────────────

  describe('parseXmlToJson()', () => {
    it('should parse a minimal pacs.008 XML snippet into an object', async () => {
      const result = await parser.parseXmlToJson(MINIMAL_PACS008_XML);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should extract the top-level Document element', async () => {
      const result = await parser.parseXmlToJson(MINIMAL_PACS008_XML);
      expect(result).toHaveProperty('Document');
    });

    it('should parse MsgId into the correct string value', async () => {
      const result = await parser.parseXmlToJson(MINIMAL_PACS008_XML);
      const doc = result['Document'] as Record<string, unknown>;
      const grp = (doc['FIToFICstmrCdtTrf'] as Record<string, unknown>)['GrpHdr'] as Record<string, unknown>;
      expect(grp['MsgId']).toBe('MSG-001');
    });
  });

  // ─── parseJsonToXml() ────────────────────────────────────────────────────────

  describe('parseJsonToXml()', () => {
    it('should serialise a minimal JSON object to an XML string', async () => {
      const xml = await parser.parseJsonToXml(MINIMAL_JSON);
      expect(typeof xml).toBe('string');
      expect(xml.length).toBeGreaterThan(0);
    });

    it('should include the root element name in the output XML', async () => {
      const xml = await parser.parseJsonToXml(MINIMAL_JSON);
      expect(xml).toContain('Document');
    });

    it('should include field values in the output XML', async () => {
      const xml = await parser.parseJsonToXml(MINIMAL_JSON);
      expect(xml).toContain('MSG-001');
    });
  });

  // ─── round-trip ──────────────────────────────────────────────────────────────

  describe('round-trip XML → JSON → XML', () => {
    it('should produce structurally equivalent output after a round-trip', async () => {
      // Parse XML to JSON
      const json = await parser.parseXmlToJson(MINIMAL_PACS008_XML);
      // Re-serialise JSON back to XML
      const roundTrippedXml = await parser.parseJsonToXml(json);
      // Parse the round-tripped XML again
      const roundTrippedJson = await parser.parseXmlToJson(roundTrippedXml);

      // The JSON structures should be deeply equal after round-trip.
      expect(roundTrippedJson).toEqual(json);
    });

    it('should preserve the MsgId value through a round-trip', async () => {
      const json = await parser.parseXmlToJson(MINIMAL_PACS008_XML);
      const xml = await parser.parseJsonToXml(json);
      const result = await parser.parseXmlToJson(xml);

      const doc = result['Document'] as Record<string, unknown>;
      const grp = (doc['FIToFICstmrCdtTrf'] as Record<string, unknown>)['GrpHdr'] as Record<string, unknown>;
      expect(grp['MsgId']).toBe('MSG-001');
    });
  });
});
