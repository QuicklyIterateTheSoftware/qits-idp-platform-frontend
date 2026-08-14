import { provideBrowserGlobalErrorListeners, type ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideQitsNavigation } from '@qits/ui-components';

import { routes } from './app.routes';

/**
 * Four providers, in the order spa-home documents and every sibling explorer repeats.
 *
 * - `provideBrowserGlobalErrorListeners` funnels genuinely-global errors and unhandled rejections
 *   into Angular's `ErrorHandler`.
 * - `provideRouter` carries this app's state: all four pages are a path segment, so each is
 *   bookmarkable and the back button works with no code.
 * - `withFetch` is not a preference. The default XHR backend is invisible to OTLP fetch
 *   instrumentation, so choosing it would quietly forfeit client spans the moment this deployment
 *   grows a telemetry relay. Every call this app will make is a same-origin path behind the edge —
 *   and unlike the sibling explorers, none of them is anonymous: this service's own reads
 *   authenticate, which is the problem the login flow exists to solve.
 * - `provideQitsNavigation` gives `QitsMainLayout` its left navigation, by asking the gateway for
 *   `/main-navigation` once at startup. The list is the gateway's answer — derived from the routes
 *   it actually serves — not a list compiled into @qits/ui-components; without this provider the
 *   chrome renders no links at all. It needs the `provideHttpClient` above.
 *
 * The last one is provided even though half of this app's pages never mount the chrome. A provider
 * costs one request at bootstrap and the auth pages simply do not consume it; making the
 * navigation conditional would mean two configurations to keep in step for no gain.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideQitsNavigation(),
  ],
};
