import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import type { Device } from '../api/dto';

/**
 * The signed-in devices page, driven through the router with the service answered by
 * `HttpTestingController`.
 *
 * The assertions worth having are the ones about what the page is NOT allowed to decide: it must
 * take `kind` from the server rather than matching on a configured client id, and a revoked family
 * must stay visible so "I revoked that yesterday" is answerable.
 */
describe('DevicesPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  const CLI: Device = {
    id: '11111111-0000-4000-8000-000000000001',
    clientId: 'qits-cli',
    kind: 'cli',
    createdAt: '2026-09-12T09:00:00Z',
    expiresAt: '2026-10-12T09:00:00Z',
    revokedAt: null,
  };

  const WORKSTATION: Device = {
    id: '11111111-0000-4000-8000-000000000002',
    clientId: 'qits-git-workstation',
    kind: 'workstation',
    createdAt: '2026-09-11T09:00:00Z',
    expiresAt: '2026-10-11T09:00:00Z',
    revokedAt: '2026-09-11T10:00:00Z',
  };

  /** A family whose client this installation no longer configures. */
  const STRANGER: Device = {
    ...CLI,
    id: '11111111-0000-4000-8000-000000000003',
    clientId: 'qits-something-else',
    kind: 'unknown',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function open(answer: Device[]): Promise<void> {
    harness = await RouterTestingHarness.create('/devices');
    await settle();
    http.expectOne('/idp/api/devices').flush(answer);
    await settle();
  }

  async function settle(): Promise<void> {
    for (let round = 0; round < 6; round += 1) {
      await Promise.resolve();
      await harness.fixture.whenStable();
    }
  }

  function text(): string {
    return (harness.fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function revokeButtons(): HTMLElement[] {
    return Array.from(
      (harness.fixture.nativeElement as HTMLElement).querySelectorAll('qits-button button'),
    );
  }

  it('names each kind in the server’s words', async () => {
    await open([CLI, WORKSTATION, STRANGER]);

    expect(text()).toContain('Command line');
    expect(text()).toContain('Git workstation');
    // No mapping from a configured id: an unrecognised kind falls back to the id itself, which is
    // the only true thing left to say about it.
    expect(text()).toContain('qits-something-else');
  });

  it('keeps a revoked family listed and offers no button for it', async () => {
    await open([CLI, WORKSTATION]);

    expect(text()).toContain('Revoked');
    expect(revokeButtons()).toHaveLength(1);
  });

  it('revokes one device and re-reads the list', async () => {
    await open([CLI, WORKSTATION]);

    revokeButtons()[0].dispatchEvent(new Event('click'));
    await settle();

    const revoke = http.expectOne(`/idp/api/devices/${CLI.id}`);
    expect(revoke.request.method).toBe('DELETE');
    revoke.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    // The page does not patch its own row: it asks again, so what it shows is what the service says.
    http
      .expectOne('/idp/api/devices')
      .flush([{ ...CLI, revokedAt: '2026-09-12T11:00:00Z' }, WORKSTATION]);
    await settle();
    expect(revokeButtons()).toHaveLength(0);
  });

  it('says one plain thing when the revoke is refused', async () => {
    await open([CLI]);

    revokeButtons()[0].dispatchEvent(new Event('click'));
    await settle();
    http
      .expectOne(`/idp/api/devices/${CLI.id}`)
      .flush({ error: 'not_found' }, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(text()).toContain('That device could not be revoked.');
    // The server's body describes whether a credential exists, and is not a browser's to relay.
    expect(text()).not.toContain('not_found');
  });

  it('says what an empty list means rather than showing an empty table', async () => {
    await open([]);

    expect(text()).toContain('Nothing is signed in.');
  });
});
