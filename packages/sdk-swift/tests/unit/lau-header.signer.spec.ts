import { LauHeaderSigner } from '../../src/security/lau-header.signer';

describe('LauHeaderSigner', () => {
  const LAU_KEY = 'test-lau-key-that-is-at-least-32-chars!!';
  let signer: LauHeaderSigner;

  beforeEach(() => {
    signer = new LauHeaderSigner(LAU_KEY);
  });

  // ─── sign() ─────────────────────────────────────────────────────────────────

  describe('sign()', () => {
    it('should return a 64-character lowercase hex string', () => {
      const signature = signer.sign('{"test":"payload"}', '2024-07-01T12:00:00.000Z');
      expect(signature).toHaveLength(64);
      expect(signature).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce the same signature for identical inputs (deterministic)', () => {
      const body = '{"msgId":"ABC123"}';
      const timestamp = '2024-07-01T12:00:00.000Z';
      const sig1 = signer.sign(body, timestamp);
      const sig2 = signer.sign(body, timestamp);
      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different timestamps', () => {
      const body = '{"msgId":"ABC123"}';
      const sig1 = signer.sign(body, '2024-07-01T12:00:00.000Z');
      const sig2 = signer.sign(body, '2024-07-01T12:00:01.000Z');
      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different bodies', () => {
      const timestamp = '2024-07-01T12:00:00.000Z';
      const sig1 = signer.sign('{"msgId":"AAA"}', timestamp);
      const sig2 = signer.sign('{"msgId":"BBB"}', timestamp);
      expect(sig1).not.toBe(sig2);
    });
  });

  // ─── buildHeader() ──────────────────────────────────────────────────────────

  describe('buildHeader()', () => {
    it('should return an object with timestamp, signature, and appId fields', () => {
      const header = signer.buildHeader('{"test":"payload"}');
      expect(header).toHaveProperty('timestamp');
      expect(header).toHaveProperty('signature');
      expect(header).toHaveProperty('appId');
    });

    it('should include a valid ISO 8601 timestamp', () => {
      const header = signer.buildHeader('body');
      const parsed = new Date(header.timestamp);
      expect(parsed.toISOString()).toBe(header.timestamp);
    });

    it('should include a 64-char hex signature', () => {
      const header = signer.buildHeader('body');
      expect(header.signature).toHaveLength(64);
      expect(header.signature).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should include the expected appId', () => {
      const header = signer.buildHeader('body');
      expect(header.appId).toBe('vnkrvietnam-swift-sdk');
    });

    it('should produce consistent signature given the same body and a fixed timestamp', () => {
      // Freeze Date to make the timestamp deterministic for this assertion.
      const fixedDate = '2024-07-01T12:00:00.000Z';
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        toISOString: () => fixedDate,
      }) as unknown as Date);

      const header1 = signer.buildHeader('{"amount":100}');
      const header2 = signer.buildHeader('{"amount":100}');
      expect(header1.signature).toBe(header2.signature);

      jest.restoreAllMocks();
    });
  });
});
