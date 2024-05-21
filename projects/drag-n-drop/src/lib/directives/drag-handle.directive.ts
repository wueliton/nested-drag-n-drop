import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[libDragHandle]',
  standalone: true,
  host: {
    class: 'lib-drag-handle'
  }
})
export class DragHandleDirective {
  elRef = inject(ElementRef);
}
