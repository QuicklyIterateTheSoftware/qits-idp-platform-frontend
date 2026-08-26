import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QitsButton } from '@qits/ui-components';
import { AuthApi } from '../api/auth-api';
import { AUTH_BROWSER } from '../auth/browser';
import { authFailure } from '../auth/failure';
import { DEFAULT_REDIRECT, safeRedirect } from '../auth/redirect';
import { asAttestation, toCreationOptions } from '../auth/webauthn';

/** Which action is in flight, or `null` when none is. Two buttons, one at a time. */
type Pending = 'passkey' | 'password' | null;

/**
 * Where a person makes an account, which on this platform means spending a token that was printed
 * once.
 *
 * **The token is what makes this page safe to leave open.** Registration is not a public invitation:
 * the platform's bootstrap mints one register token, prints it in its closing report, and the row
 * is consumed the moment an account is made from it. So the page can sit at a known URL with a
 * visible form and still admit exactly one person — the one holding the token. Every field here is
 * checked server-side before any ceremony state is created, which is why the token goes out with
 * the *options* call and not only with the finishing one.
 *
 * **The token field is not a password field**, and that is a decision rather than an oversight. It
 * is a long random string being pasted out of a terminal by the one operator entitled to it, on a
 * page where nobody is signed in yet; masking it would hide the one thing a mistyped paste shows.
 * It is spent on use, so a shoulder-surfer's window is the length of this page visit.
 *
 * **Passkey first, password beside it** — the same shape as the sign-in page, for the same reasons,
 * including the raw-IP address where `window.isSecureContext` is false and a passkey cannot exist
 * at all. See login-page.ts, which states the whole argument; both pages fail the same way and it
 * is worth them failing identically.
 *
 * **The `<form>` around the fields never submits**, and it is there so the browser's credential
 * manager can see the password field at all — same as the sign-in page, which states the argument.
 *
 * **A second factor is added later, not here.** Setting a password on an account that has a passkey
 * (or enrolling another authenticator) happens session-authenticated from an account page that does
 * not exist yet. This page's job is the first credential, and offering both at once would ask a
 * person to make two decisions when they came to make an account.
 *
 * **No chrome around it**, by the route table. See app.routes.ts.
 */
@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QitsButton, RouterLink],
  styleUrls: ['../ui/auth.css'],
  template: `
    <div class="card">
      <h1>Create an account</h1>
      <p class="lede">The platform's bootstrap printed a register token. It is spent once.</p>

      <form (submit)="$event.preventDefault()">
        <label class="field">
          <span class="label" id="token-label">Register token</span>
          <input
            type="text"
            class="text"
            autocomplete="off"
            spellcheck="false"
            autocapitalize="none"
            aria-labelledby="token-label"
            [value]="token()"
            (input)="onToken($event)"
            (keydown.enter)="withPasskey()"
          />
        </label>

        <label class="field">
          <span class="label" id="username-label">Username</span>
          <input
            type="text"
            class="text"
            autocomplete="username webauthn"
            spellcheck="false"
            autocapitalize="none"
            aria-labelledby="username-label"
            [value]="username()"
            (input)="onUsername($event)"
            (keydown.enter)="withPasskey()"
          />
        </label>

        @if (passkeys) {
          <div class="actions">
            <qits-button
              variant="primary"
              [disabled]="!ready() || pending() !== null"
              [busy]="pending() === 'passkey'"
              (pressed)="withPasskey()"
            >
              Create with a passkey
            </qits-button>
          </div>
          <p class="hint">
            Your authenticator keeps the key and this platform keeps only its public half. There is
            nothing here to steal and nothing to remember.
          </p>
        } @else {
          <p class="insecure">
            Passkeys need localhost or https, and this address is neither — so there is no passkey
            button here. A password works everywhere, including this address.
          </p>
        }

        <div class="alternative">
          <label class="field">
            <span class="label" id="password-label">Password</span>
            <input
              type="password"
              class="text"
              autocomplete="new-password"
              aria-labelledby="password-label"
              [value]="password()"
              (input)="onPassword($event)"
              (keydown.enter)="withPassword()"
            />
          </label>
          <p class="hint">Any password at all. There is no length rule and no character rule.</p>
          <div class="actions">
            <qits-button
              [variant]="passkeys ? 'secondary' : 'primary'"
              [disabled]="!ready() || !password() || pending() !== null"
              [busy]="pending() === 'password'"
              (pressed)="withPassword()"
            >
              Create with a password
            </qits-button>
          </div>
        </div>
      </form>

      @if (failure()) {
        <p class="failed" role="alert">{{ failure() }}</p>
      }

      <p class="elsewhere">Already have an account? <a routerLink="/login" queryParamsHandling="preserve">Sign in</a>.</p>
    </div>
  `,
})
export class RegisterPage {
  private readonly api = inject(AuthApi);
  private readonly browser = inject(AUTH_BROWSER);
  private readonly route = inject(ActivatedRoute);

  /** Fixed for the life of the document — see the sign-in page for why it is not a signal. */
  protected readonly passkeys = this.browser.secureContext && this.browser.credentials !== null;

  protected readonly token = signal('');
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly pending = signal<Pending>(null);
  protected readonly failure = signal<string | null>(null);

  protected readonly ready = computed(
    () => this.token().trim().length > 0 && this.username().trim().length > 0,
  );

  protected onToken(event: Event): void {
    this.token.set((event.target as HTMLInputElement).value);
  }

  protected onUsername(event: Event): void {
    this.username.set((event.target as HTMLInputElement).value);
  }

  protected onPassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  /** Options, ceremony, attestation. The token rides on both calls; the server spends it once. */
  protected async withPasskey(): Promise<void> {
    if (!this.passkeys || !this.ready() || this.pending()) return;
    const username = this.username().trim();
    const token = this.token().trim();
    this.pending.set('passkey');
    this.failure.set(null);
    try {
      const options = await this.api.registerOptions(username, token);
      const credential = await this.browser.credentials?.create({
        publicKey: toCreationOptions(options),
      });
      await this.api.register({ username, token, attestation: asAttestation(credential ?? null) });
      await this.arrive();
    } catch (error) {
      this.refuse(error);
    }
  }

  /** One call, no ceremony. The fallback, and the only door on an insecure address. */
  protected async withPassword(): Promise<void> {
    if (!this.ready() || !this.password() || this.pending()) return;
    this.pending.set('password');
    this.failure.set(null);
    try {
      await this.api.register({
        username: this.username().trim(),
        token: this.token().trim(),
        password: this.password(),
      });
      await this.arrive();
    } catch (error) {
      this.refuse(error);
    }
  }

  /**
   * Registered and signed in — the server's answer set the session cookie, so the account exists
   * and this browser is already holding it. `pending` stays set on the way out; see login-page.ts.
   */
  private async arrive(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const host = params.get('return_host');
    if (!host) {
      // Same shape as login-page.ts: a plainly local path is honoured, everything else asks the
      // IdP for the installation's landing location — `/` here is the IdP's own SPA now.
      const local = safeRedirect(params.get('return_path') ?? params.get('redirect'));
      if (local !== DEFAULT_REDIRECT) {
        this.browser.assign(local);
        return;
      }
    }
    const target = await this.api.returnLocation(
      host,
      host ? (params.get('return_path') ?? safeRedirect(params.get('redirect'))) : null,
    );
    this.browser.assign(target.location);
  }

  private refuse(error: unknown): void {
    this.failure.set(
      authFailure(
        error,
        'That did not create an account. Check the token and the username, and try again.',
      ),
    );
    this.pending.set(null);
  }
}
