import { safeRedirect } from './redirect';

/**
 * The security spec of this repository, such as it is. Everything else on the sign-in page fails
 * loudly when it is wrong; an open redirect works perfectly and hands the visitor to a stranger
 * afterwards, so the refusals matter more here than the acceptance does.
 */
describe('safeRedirect', () => {
  it('keeps an ordinary same-origin path', () => {
    expect(safeRedirect('/idp/clients')).toBe('/idp/clients');
    expect(safeRedirect('/')).toBe('/');
  });

  it('keeps a query string and a fragment along with it', () => {
    expect(safeRedirect('/projects?tab=all#top')).toBe('/projects?tab=all#top');
  });

  it('refuses a protocol-relative url, which is an absolute one wearing a path', () => {
    expect(safeRedirect('//evil.example')).toBe('/');
    expect(safeRedirect('//evil.example/idp/clients')).toBe('/');
  });

  it('refuses a backslash after the slash, which browsers normalise into the above', () => {
    expect(safeRedirect('/\\evil.example')).toBe('/');
  });

  it('refuses anything carrying a scheme', () => {
    expect(safeRedirect('https://evil.example')).toBe('/');
    expect(safeRedirect('javascript:alert(1)')).toBe('/');
  });

  it('refuses a relative path, because only the edge writes this parameter', () => {
    expect(safeRedirect('idp/clients')).toBe('/');
  });

  it('refuses control characters rather than stripping them', () => {
    expect(safeRedirect('/idp\n/clients')).toBe('/');
    expect(safeRedirect('/idp\t/clients')).toBe('/');
  });

  it('answers with the front door when there is no parameter at all', () => {
    expect(safeRedirect('')).toBe('/');
    expect(safeRedirect(null)).toBe('/');
    expect(safeRedirect(undefined)).toBe('/');
  });
});
