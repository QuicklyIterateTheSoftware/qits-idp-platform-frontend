import type { Routes } from '@angular/router';
import { QitsMainLayout } from '@qits/ui-components';
import { NotFound } from './not-found/not-found';

/**
 * Four doors: two that sign a person in, and two that administer what they sign in to.
 *
 * **`login` and `register` sit outside the layout, and that is the shape rather than an oversight.**
 * An auth page renders no platform chrome: a sidebar full of links to services the visitor has not
 * been admitted to is an invitation to click something that will refuse them, and a top bar that
 * says who is signed in is a lie on the page where nobody is. So the two of them are top-level
 * routes, siblings of the layout and not children of it.
 *
 * **`QitsMainLayout` is the root route component** for everything else — the platform's convention,
 * stated in the component's own docs. Mounted this way the bar and the navigation mount once and
 * survive every navigation beneath them; wrapping each page in a tag would rebuild the whole
 * skeleton on every hop. It is an eager import for that reason: it is not a page, it is the frame
 * the pages arrive in, and a frame that loads in its own chunk would show the user a blank
 * application while it did.
 *
 * **Every page loads lazily, and this repository is the platform's first SPA to do it.** The reason
 * is the split above. A visitor at `/idp/login` is, by definition, not yet allowed to see a client
 * roster — shipping the admin pages in the bundle that draws the sign-in form would make the
 * slowest, most public page on the platform pay for code that page can never legally use. The
 * reverse holds just as well: an operator who is already signed in and going to `/idp/clients`
 * should not download a sign-in form to get there. `loadComponent` per page is what makes each of
 * those four URLs cost only itself, and it is cheap here because these pages share no state and
 * almost no code. Where a sibling explorer's two views sit on one stack of shared table components
 * — spa-mirror says so in its own routes, and loads both eagerly — these do not.
 *
 * **The `'' → clients` redirect is provisional.** Bare `/idp/` should land on whatever the visitor
 * is: a sign-in form when nobody is, an administrative home when someone is. Neither answer can be
 * given until a login flow exists to ask the question, so until then the door opens on the one page
 * that has something real behind it. Expect this line to change, and change it when the flow lands
 * rather than growing a guard around it now.
 *
 * The `**` route sits inside the layout: `/idp/` is a segment this application owns outright, so an
 * unknown URL under it is an ordinary 404 and is drawn with the chrome around it.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register-page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    component: QitsMainLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clients' },
      {
        path: 'clients',
        loadComponent: () => import('./clients/clients-page').then((m) => m.ClientsPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users-page').then((m) => m.UsersPage),
      },
      { path: '**', component: NotFound },
    ],
  },
];
