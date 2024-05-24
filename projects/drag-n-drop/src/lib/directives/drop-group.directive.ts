import { Directive, InjectionToken, contentChildren } from '@angular/core';
import { DropListDirective } from './drop-list.directive';

export const LIB_DROP_GROUP = new InjectionToken<DropGroupDirective>(
  'LIB_DROP_GROUP'
);

@Directive({
  selector: '[libDropGroup]',
  standalone: true,
  providers: [{ provide: LIB_DROP_GROUP, useExisting: DropGroupDirective }],
})
export class DropGroupDirective {
  dropDirectives = contentChildren(DropListDirective);
}
