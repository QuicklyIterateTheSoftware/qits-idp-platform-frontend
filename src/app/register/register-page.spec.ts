import { TestBed } from '@angular/core/testing';
import { RegisterPage } from './register-page';

/** Same absence as the sign-in page beside it: a name on screen, and nothing that takes input. */
describe('RegisterPage', () => {
  it('names itself and offers no field to type a credential into', async () => {
    const fixture = TestBed.createComponent(RegisterPage);
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Create an account');
    expect(page.querySelector('input')).toBeNull();
    expect(page.querySelector('form')).toBeNull();
  });
});
