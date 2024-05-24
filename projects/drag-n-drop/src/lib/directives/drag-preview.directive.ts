import {
  Directive,
  InjectionToken,
  OnDestroy,
  TemplateRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { CDK_DRAG_PARENT } from './drag-n-drop.directive';

export const LIB_DRAG_PREVIEW = new InjectionToken<DragPreviewDirective>(
  'LIB_DRAG_PREVIEW'
);

@Directive({
  selector: '[libDragPreview]',
  standalone: true,
  providers: [{ provide: LIB_DRAG_PREVIEW, useExisting: DragPreviewDirective }],
})
export class DragPreviewDirective<T = any> implements OnDestroy {
  #drag = inject(CDK_DRAG_PARENT, { optional: true });
  data = input<T>();
  matchSize = input(false, { transform: booleanAttribute });

  constructor(public templateRef: TemplateRef<T>) {
    this.#drag?.setPreviewTemplate(this);
  }

  ngOnDestroy() {
    this.#drag?.resetPreviewTemplate(this);
  }
}
