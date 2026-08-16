import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { AUTH_BROWSER, type AuthBrowser } from '../auth/browser';

/**
 * Registration, driven the same way the sign-in page beside it is: real router, real requests
 * through `HttpTestingController`, and the browser itself behind the one token that stands in for
 * it. The extra thing asserted here is the register token — it must ride on *both* calls, because
 * the server checks it before it creates any ceremony state and again when it spends the row.
 */
describe('RegisterPage', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  let ceremonies: PublicKeyCredentialCreationOptions[];
  let assigned: string[];

  const SESSION = {
    userId: '3f9b3f1e-0000-4000-8000-000000000001',
    username: 'alice',
    roles: ['qits-platform:admin', 'qits:admin'],
    expiresAt: '2026-08-15T06:00:00Z',
  };

  /** What `navigator.credentials.create` resolves with, reduced to the fields that go on the wire. */
  const CREATED = {
    id: 'credential-id',
    rawId: new Uint8Array([1, 2, 3]).buffer,
    type: 'public-key',
    response: {
      clientDataJSON: new Uint8Array([4, 5, 6]).buffer,
      attestationObject: new Uint8Array([7, 8, 9]).buffer,
      getTransports: () => ['internal'],
    },
  } as unknown as Credential;

  function capable(): AuthBrowser {
    return {
      secureContext: true,
      credentials: {
        create: (options?: CredentialCreationOptions) => {
          if (options?.publicKey) ceremonies.push(options.publicKey);
          return Promise.resolve(CREATED);
        },
        get: () => Promise.resolve(null),
      } as unknown as CredentialsContainer,
      assign: (url: string) => assigned.push(url),
    };
  }

  function insecure(): AuthBrowser {
    return { secureContext: false, credentials: null, assign: (url) => assigned.push(url) };
  }

  function configure(browser: AuthBrowser): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_BROWSER, useValue: browser },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  }

  async function open(url = '/register'): Promise<void> {
    harness = await RouterTestingHarness.create(url);
    await settle();
  }

  async function settle(): Promise<void> {
    for (let round = 0; round < 6; round += 1) {
      await Promise.resolve();
      await harness.fixture.whenStable();
    }
  }

  function page(): HTMLElement {
    return harness.fixture.nativeElement as HTMLElement;
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(page().querySelectorAll('button'));
  }

  async function type(selector: string, value: string): Promise<void> {
    const input = page().querySelector<HTMLInputElement>(selector);
    expect(input, `no input matching ${selector}`).toBeTruthy();
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    await settle();
  }

  async function fillIdentity(): Promise<void> {
    await type('input[autocomplete="off"]', 'token-abc');
    await type('input[autocomplete="username webauthn"]', 'alice');
  }

  async function press(label: string): Promise<void> {
    const target = buttons().find((button) => (button.textContent ?? '').includes(label));
    expect(target, `no button reading "${label}"`).toBeTruthy();
    target?.click();
    await settle();
  }

  beforeEach(() => {
    ceremonies = [];
    assigned = [];
  });

  afterEach(() => http.verify());

  describe('on an address that can run a ceremony', () => {
    beforeEach(() => configure(capable()));

    it('asks for a token and a username, and offers the passkey first', async () => {
      await open();

      expect(page().querySelector('h1')?.textContent).toContain('Create an account');
      expect(page().querySelector('input[autocomplete="off"]')).not.toBeNull();
      expect(page().querySelector('input[autocomplete="username webauthn"]')).not.toBeNull();
      expect(buttons().some((button) => button.textContent?.includes('passkey'))).toBe(true);
      http.verify();
    });

    it('will not start without both the token and the username', async () => {
      await open();
      await type('input[autocomplete="username webauthn"]', 'alice');

      const passkey = buttons().find((button) => button.textContent?.includes('passkey'));
      expect(passkey?.disabled).toBe(true);
      http.verify();
    });

    it('runs the whole passkey flow, token on both calls, and leaves for the front door', async () => {
      await open();
      await fillIdentity();
      await press('passkey');

      const options = http.expectOne('/idp/api/auth/register-options');
      expect(options.request.body).toEqual({ username: 'alice', token: 'token-abc' });
      options.flush({
        rp: { id: 'localhost', name: 'qits platform' },
        user: { id: 'AQID', name: 'alice', displayName: 'alice' },
        challenge: 'BAUG',
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 300000,
        excludeCredentials: [],
        authenticatorSelection: {
          requireResidentKey: true,
          residentKey: 'required',
          userVerification: 'required',
        },
        attestation: 'none',
        extensions: {},
      });
      await settle();

      expect(ceremonies).toHaveLength(1);
      expect(Array.from(new Uint8Array(ceremonies[0].challenge as ArrayBuffer))).toEqual([4, 5, 6]);
      expect(Array.from(new Uint8Array(ceremonies[0].user.id as ArrayBuffer))).toEqual([1, 2, 3]);
      expect(ceremonies[0].rp.id).toBe('localhost');

      const register = http.expectOne('/idp/api/auth/register');
      expect(register.request.body).toEqual({
        username: 'alice',
        token: 'token-abc',
        attestation: {
          id: 'credential-id',
          rawId: 'AQID',
          type: 'public-key',
          response: {
            clientDataJSON: 'BAUG',
            attestationObject: 'BwgJ',
            transports: ['internal'],
          },
        },
      });
      register.flush(SESSION);
      await settle();

      expect(assigned).toEqual(['/']);
    });

    it('registers with a password instead when that button is pressed', async () => {
      await open();
      await fillIdentity();
      await type('input[type="password"]', 'hunter2');
      await press('password');

      const register = http.expectOne('/idp/api/auth/register');
      expect(register.request.body).toEqual({
        username: 'alice',
        token: 'token-abc',
        password: 'hunter2',
      });
      register.flush(SESSION);
      await settle();

      expect(assigned).toEqual(['/']);
      expect(ceremonies).toHaveLength(0);
    });

    it('honours a sanitized redirect, the same as the sign-in page', async () => {
      await open('/register?redirect=%2Fidp%2Fclients');
      await fillIdentity();
      await type('input[type="password"]', 'hunter2');
      await press('password');
      http.expectOne('/idp/api/auth/register').flush(SESSION);
      await settle();

      expect(assigned).toEqual(['/idp/clients']);
    });

    it('asks the IdP to validate a cross-host return after registration', async () => {
      await open('/register?return_host=prod.wohlben.eu&return_path=%2Fprojects');
      await fillIdentity();
      await type('input[type="password"]', 'hunter2');
      await press('password');
      http.expectOne('/idp/api/auth/register').flush(SESSION);
      await settle();
      http
        .expectOne(
          (request) =>
            request.url === '/idp/api/auth/return-location' &&
            request.params.get('return_host') === 'prod.wohlben.eu' &&
            request.params.get('return_path') === '/projects',
        )
        .flush({ location: 'https://prod.wohlben.eu/projects' });
      await settle();

      expect(assigned).toEqual(['https://prod.wohlben.eu/projects']);
    });

    it('says one calm thing on a spent token, and nothing the server said', async () => {
      await open();
      await fillIdentity();
      await type('input[type="password"]', 'hunter2');
      await press('password');
      http
        .expectOne('/idp/api/auth/register')
        .flush({ error: 'invalid_request' }, { status: 400, statusText: 'Bad Request' });
      await settle();

      const alert = page().querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('did not create an account');
      expect(page().textContent).not.toContain('invalid_request');
      expect(assigned).toEqual([]);
    });
  });

  describe('on an address that cannot', () => {
    beforeEach(() => configure(insecure()));

    it('draws no passkey button and says in one sentence why', async () => {
      await open();

      expect(buttons().some((button) => button.textContent?.includes('passkey'))).toBe(false);
      expect(page().textContent).toContain('Passkeys need localhost or https');
      expect(page().textContent).toContain('A password works everywhere');
      http.verify();
    });

    it('still makes the account with a password', async () => {
      await open();
      await fillIdentity();
      await type('input[type="password"]', 'hunter2');
      await press('password');
      http.expectOne('/idp/api/auth/register').flush(SESSION);
      await settle();

      expect(assigned).toEqual(['/']);
    });
  });
});
