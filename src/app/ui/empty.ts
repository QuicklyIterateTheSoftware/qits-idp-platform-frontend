import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Something that holds nothing, said in a sentence.
 *
 * It exists so that "there is nothing to show yet" is never drawn as blank space. Blank space says
 * the same thing as a failed read, a page that has not finished loading, and a page whose author
 * forgot to write it — and on this application's two administrative pages those all lead an
 * operator somewhere different.
 */
@Component({
  selector: 'app-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="empty">{{ message() }}</p>`,
  styles: `
    .empty {
      margin: 0.15rem 0;
      color: #6b7280;
      font-style: italic;
    }
  `,
})
export class Empty {
  readonly message = input.required<string>();
}
