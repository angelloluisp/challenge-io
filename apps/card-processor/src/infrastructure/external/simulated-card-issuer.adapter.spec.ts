import { ImmediateSleeper } from '@shared/index';
import { SimulatedCardIssuerAdapter } from './simulated-card-issuer.adapter';

describe('SimulatedCardIssuerAdapter', () => {
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    dateNowSpy = jest.spyOn(global.Math, 'random');
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('throws CardIssuerError when forceError is true', async () => {
    const adapter = new SimulatedCardIssuerAdapter(new ImmediateSleeper());

    await expect(
      adapter.issueCard({ requestId: 'req-1', documentNumber: '11654321', forceError: true }),
    ).rejects.toThrow('Forced failure for request req-1');
  });

  it('returns simulated card data on the success path', async () => {
    dateNowSpy.mockReturnValue(0.5);
    const adapter = new SimulatedCardIssuerAdapter(new ImmediateSleeper());

    const result = await adapter.issueCard({
      requestId: 'req-2',
      documentNumber: '11654321',
      forceError: false,
    });

    expect(result.cardNumber).toMatch(/^4\d{15}$/);
    expect(result.cardId).toHaveLength(12);
    expect(result.cvv).toHaveLength(3);
    expect(result.expirationDate).toMatch(/^\d{2}\/\d{2}$/);
  });

  it('throws CardIssuerError on the random failure path when Math.random falls below the failure rate threshold', async () => {
    dateNowSpy.mockReturnValue(0.01);
    const adapter = new SimulatedCardIssuerAdapter(new ImmediateSleeper());

    await expect(
      adapter.issueCard({ requestId: 'req-3', documentNumber: '11654321', forceError: false }),
    ).rejects.toThrow('External card issuer rejected request req-3');
  });

  it('delays execution using the injected sleeper', async () => {
    const sleeper = { sleep: jest.fn().mockResolvedValue(undefined) };
    dateNowSpy.mockReturnValue(0.5);
    const adapter = new SimulatedCardIssuerAdapter(sleeper);

    await adapter.issueCard({ requestId: 'req-4', documentNumber: '11654321', forceError: false });

    expect(sleeper.sleep).toHaveBeenCalledTimes(1);
    const delayArgument = sleeper.sleep.mock.calls[0][0] as number;
    expect(delayArgument).toBeGreaterThanOrEqual(200);
    expect(delayArgument).toBeLessThanOrEqual(500);
  });
});
