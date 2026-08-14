import { TestBed } from '@angular/core/testing';
import { LoginPage } from './login-page';

/**
 * What is asserted is mostly an absence, and that is the point of the file. The page's whole
 * promise today is that it takes no credential — so the spec that would catch a regression is the
 * one that fails the moment an input appears without the backend flow behind it.
 */
describe('LoginPage', () => {
  it('names itself and offers no field to type a credential into', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Sign in');
    expect(page.querySelector('input')).toBeNull();
    expect(page.querySelector('form')).toBeNull();
  });
});
