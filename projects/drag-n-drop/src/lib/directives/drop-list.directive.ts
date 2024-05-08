import {
  Directive,
  ElementRef,
  Renderer2,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DragNDropService, LibDragDrop } from '../drag-n-drop.service';
import { filter, fromEvent, merge, switchMap, takeUntil, tap } from 'rxjs';
import { getChildNodeIndex } from '../utils';

@Directive({
  selector: '[libDropList]',
  standalone: true,
})
export class DropListDirective {
  #dragNDropService = inject(DragNDropService);
  #renderer = inject(Renderer2);
  elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  dropped = output<LibDragDrop>({ alias: 'libDropListDropped' });

  private onDropItem() {
    return fromEvent(this.elRef.nativeElement, 'mouseup').pipe(
      filter(() => !!this.#dragNDropService.activeItem()),
      tap((event) => {
        const item = this.#dragNDropService.activeItem();
        this.#dragNDropService.setActiveItem(null);
        const index = getChildNodeIndex(
          this.elRef.nativeElement.children,
          event.target
        );

        if (item?.dropEl === this.elRef.nativeElement && index === item.index)
          return;

        //Need to wait item animation moving to list to emit dropped item
        setTimeout(
          () =>
            this.dropped.emit({
              container: {
                data: item!.data,
                el: item!.el,
                dropEl: this.elRef.nativeElement,
                index: index,
              },
              previousContainer: item!,
            }),
          230
        );
      })
    );
  }

  private onMouseMove() {
    return fromEvent<MouseEvent>(this.elRef.nativeElement, 'mouseover').pipe(
      tap((event) => {
        event.stopPropagation();
        this.#dragNDropService.setHoveredDropList(this.elRef.nativeElement);
        this.#renderer.insertBefore(
          this.elRef.nativeElement,
          this.#dragNDropService.clonedItem(),
          this.elRef.nativeElement.firstChild
        );
        const index = getChildNodeIndex(
          this.elRef.nativeElement.children,
          event.target
        );

        if (index === -1) return;

        // const { height: targetHeight } = (
        //   event.target as HTMLElement
        // ).getBoundingClientRect();
        // const { height: cloneHeight } = (
        //   this.#dragNDropService.clonedItem() as HTMLDivElement
        // ).getBoundingClientRect();

        // this.#renderer.setStyle(
        //   this.#dragNDropService.clonedItem(),
        //   'transform',
        //   `translate3d(0px, ${targetHeight}px, 0px)`
        // );

        // this.#renderer.setStyle(
        //   event.target,
        //   'transform',
        //   `translate3d(0px, -${cloneHeight}px, 0px)`
        // );
      })
    );
  }

  constructor() {
    toObservable(this.#dragNDropService.activeItem)
      .pipe(
        filter((item) => !!item),
        switchMap(() =>
          merge(this.onDropItem(), this.onMouseMove()).pipe(
            takeUntil(
              fromEvent(window, 'mouseup').pipe(
                tap(() => this.#dragNDropService.setHoveredDropList(null))
              )
            )
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe();
  }
}
