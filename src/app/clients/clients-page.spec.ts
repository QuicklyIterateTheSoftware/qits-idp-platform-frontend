import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ClientsPage } from './clients-page';

/**
 * The empty state is drawn, and no request goes out to draw it.
 *
 * The second half is the assertion that will earn its keep. Reading the roster needs a client's own
 * Basic pair, which no browser session can present yet, so a call added here before the login flow
 * exists would be a guaranteed 401 — and `http.verify()` is what turns that from a console error
 * somebody scrolls past into a failing test.
 */
describe('ClientsPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('says why the roster is empty, and asks nobody for it', async () => {
    const fixture = TestBed.createComponent(ClientsPage);
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Clients');
    expect(page.querySelector('app-empty')?.textContent).toContain('No client is listed');
    expect(page.querySelector('table')).toBeNull();
    http.verify();
  });
});
