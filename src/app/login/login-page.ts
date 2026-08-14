import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Where a person will sign in. Today it says so, and does nothing.
 *
 * **The emptiness is the content.** This service has no user, no password, no session and no
 * authorization endpoint — it issues tokens to *machines*, against a client id and secret, and the
 * whole human half is a later phase. A form drawn here now would take a password the backend has
 * nowhere to check, and a sign-in box that silently fails is worse than an honest gap: someone
 * will type a real credential into it.
 *
 * So there is no form, no input, no "remember me" and no provider button. The route and the
 * chromeless frame exist — which is the part that is expensive to retrofit — and the flow lands in
 * this component when the backend has one to land.
 *
 * **No chrome around it**, by the route table rather than by anything here: this page is a sibling
 * of `QitsMainLayout`, not a child. A visitor who is not signed in should not be looking at a
 * sidebar of services they cannot open. See app.routes.ts.
 */
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../ui/auth.css'],
  template: `
    <div class="card">
      <h1>Sign in</h1>
      <p>
        There is nothing to sign in to yet. This identity provider issues tokens to services, not to
        people, and the flow that admits a person is still being built.
      </p>
    </div>
  `,
})
export class LoginPage {}
