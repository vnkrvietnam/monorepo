import axios from 'axios';
import { GpiTrackerClient, GpiPaymentStatus } from '../../src/clients/gpi-tracker.client';
import { LauHeaderSigner } from '../../src/security/lau-header.signer';

// Mock the entire axios module so no real HTTP calls are made.
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/** A valid GpiPaymentStatus fixture for use across multiple tests. */
const MOCK_GPI_STATUS: GpiPaymentStatus = {
  uetr: '550e8400-e29b-41d4-a716-446655440000',
  status: 'ACSP',
  lastUpdateDt: '2024-07-01T12:00:00.000Z',
  agents: [
    { bicfi: 'VNKRVNVX', trackerStatus: 'ACSP' },
    { bicfi: 'CHASUS33', trackerStatus: 'ACSP' },
  ],
};

describe('GpiTrackerClient (integration)', () => {
  const GATEWAY_URL = 'https://sandbox.swiftnet.sipn.swift.com/swift/api/v1';
  const LAU_KEY = 'integration-test-lau-key-at-least-32-chars!!';

  let signer: LauHeaderSigner;
  let client: GpiTrackerClient;

  beforeEach(() => {
    signer = new LauHeaderSigner(LAU_KEY);
    client = new GpiTrackerClient(GATEWAY_URL, signer);
    jest.clearAllMocks();
  });

  // ─── trackByUetr() — happy path ─────────────────────────────────────────────

  describe('trackByUetr() — success', () => {
    it('should return a valid GpiPaymentStatus object for a known UETR', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: MOCK_GPI_STATUS });

      const result = await client.trackByUetr('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeDefined();
      expect(result.uetr).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.status).toBe('ACSP');
      expect(result.lastUpdateDt).toBe('2024-07-01T12:00:00.000Z');
    });

    it('should return an agents array with the correct bicfi values', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: MOCK_GPI_STATUS });

      const result = await client.trackByUetr('550e8400-e29b-41d4-a716-446655440000');

      expect(Array.isArray(result.agents)).toBe(true);
      expect(result.agents).toHaveLength(2);
      expect(result.agents[0].bicfi).toBe('VNKRVNVX');
      expect(result.agents[1].bicfi).toBe('CHASUS33');
    });

    it('should call the correct GPI tracker endpoint', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: MOCK_GPI_STATUS });

      const uetr = '550e8400-e29b-41d4-a716-446655440000';
      await client.trackByUetr(uetr);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}/swift/txtracking/v2/transactions/${uetr}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-SWIFT-Signature': expect.any(String),
            'X-SWIFT-Timestamp': expect.any(String),
            'X-SWIFT-AppId': 'vnkrvietnam-swift-sdk',
          }),
        })
      );
    });
  });

  // ─── trackByUetr() — error handling ─────────────────────────────────────────

  describe('trackByUetr() — error handling', () => {
    it('should throw an error when the gateway returns a 404 (invalid UETR)', async () => {
      const notFoundError = Object.assign(new Error('Request failed with status code 404'), {
        response: { status: 404, data: { message: 'Transaction not found' } },
        isAxiosError: true,
      });
      mockedAxios.get.mockRejectedValueOnce(notFoundError);

      await expect(
        client.trackByUetr('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Request failed with status code 404');
    });

    it('should throw an error on a 500 gateway error', async () => {
      const serverError = Object.assign(new Error('Request failed with status code 500'), {
        response: { status: 500, data: { message: 'Internal Server Error' } },
        isAxiosError: true,
      });
      mockedAxios.get.mockRejectedValueOnce(serverError);

      await expect(
        client.trackByUetr('550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow('Request failed with status code 500');
    });

    it('should propagate network errors (no response)', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(
        client.trackByUetr('550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow('Network Error');
    });
  });
});
