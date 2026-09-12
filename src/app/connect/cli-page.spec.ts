import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { AUTH_BROWSER, type AuthBrowser } from '../auth/browser';

/**
 * The page a browser lands on at the end of `qits login`, driven through the router so the `?code=`
 * it reads is a real query parameter and the erasure that follows is a real navigation.
 *
 * Same rules as the login page's specs: nothing outside the component is mocked at the module
 * level — the clipboard arrives through `AUTH_BROWSER`, and `HttpTestingController` is here for one
 * assertion only, which is that this page never calls anybody.
 */
describe('CliPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let copied: string[];

  function browser(answer = true): AuthBrowser {
    return {
      secureContext: true,
      credentials: null,
      assign: () => undefined,
      copy: (text: string) => {
        copied.push(text);
        return Promise.resolve(answer);
      },
    };
  }

  function configure(view: AuthBrowser): void {
    copied = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_BROWSER, useValue: view },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  }

  async function open(url: string): Promise<void> {
    harness = await RouterTestingHarness.create(url);
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

  it('shows the code and says what to do with it', async () => {
    configure(browser());
    await open('/connect/cli?code=abc123&state=whatever');

    const code = (harness.fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="code"]',
    );
    expect(code?.textContent?.trim()).toBe('abc123');
    expect(text()).toContain('It works once and expires in 5 minutes.');
  });

  it('takes the code out of the address bar without adding a history entry', async () => {
    configure(browser());
    await open('/connect/cli?code=secret-code');

    // The credential is gone from the URL...
    expect(TestBed.inject(Router).url).toBe('/connect/cli');
    // ...and still on the page, because the component read it before erasing it.
    expect(text()).toContain('secret-code');
  });

  it('copies on request and says so', async () => {
    configure(browser());
    await open('/connect/cli?code=abc123');

    (harness.fixture.nativeElement as HTMLElement)
      .querySelector('qits-button button')
      ?.dispatchEvent(new Event('click'));
    await settle();

    expect(copied).toEqual(['abc123']);
    expect(text()).toContain('Copied.');
  });

  it('says nothing about copying when the browser refused', async () => {
    configure(browser(false));
    await open('/connect/cli?code=abc123');

    (harness.fixture.nativeElement as HTMLElement)
      .querySelector('qits-button button')
      ?.dispatchEvent(new Event('click'));
    await settle();

    // The code is still on the page and selectable, so a clipboard this context would not give is
    // not an error worth showing.
    expect(text()).not.toContain('Copied.');
    expect(text()).toContain('abc123');
  });

  it('explains the failure when /authorize sent an error instead of a code', async () => {
    configure(browser());
    await open('/connect/cli?error=invalid_request');

    expect(text()).toContain('That sign-in did not complete');
    expect(text()).toContain('Run qits login again');
    expect(text()).not.toContain('invalid_request');
  });

  it('asks nobody for anything', async () => {
    configure(browser());
    await open('/connect/cli?code=abc123');

    // The whole point of the page: a document that held a credential in its URL makes no request
    // that could carry it anywhere.
    http.verify();
  });
});
