import {
  DestroyRef,
  Directive,
  ElementRef,
  OnInit,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DragNDropService, LibDragDrop } from '../drag-n-drop.service';
import { delay, filter, fromEvent, switchMap, takeUntil, tap } from 'rxjs';

@Directive({
  selector: '[libDropList]',
  standalone: true,
})
export class DropListDirective implements OnInit {
  #dragNDropService = inject(DragNDropService);
  elRef = inject(ElementRef);
  dropped = output<LibDragDrop>({ alias: 'libDropListDropped' });
  destroyRef = inject(DestroyRef);

  private onDropItem() {
    return fromEvent(this.elRef.nativeElement, 'mouseup').pipe(
      filter(() => !!this.#dragNDropService.activeItem()),
      tap(() => {
        const item = this.#dragNDropService.activeItem();
        this.#dragNDropService.setActiveItem(null);

        //Aguarda o tempo da animação do item para emitir
        setTimeout(
          () =>
            this.dropped.emit({
              container: {
                data: item!.data,
                el: item!.el,
                dropEl: this.elRef.nativeElement,
              },
              previousContainer: item!,
            }),
          230
        );
      }),
      takeUntil(fromEvent(window, 'mouseup'))
    );
  }

  ngOnInit() {
    this.#dragNDropService.activeItem$
      .pipe(
        filter((item) => !!item),
        switchMap(() => this.onDropItem()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
