import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersPage } from './users-page';

/**
 * A slot with nothing in it, said out loud. There is no users endpoint to call, so the request
 * check below is the one that keeps this page honest about that.
 */
describe('UsersPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('says there are no users, and asks nobody for them', async () => {
    const fixture = TestBed.createComponent(UsersPage);
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Users');
    expect(page.querySelector('app-empty')?.textContent).toContain('There are no users');
    http.verify();
  });
});
