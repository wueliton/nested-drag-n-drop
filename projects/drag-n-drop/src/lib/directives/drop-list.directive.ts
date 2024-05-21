import {
  Directive,
  ElementRef,
  NgZone,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DragNDropService, LibDragDrop } from '../drag-n-drop.service';
import { filter, fromEvent, switchMap, takeUntil, tap } from 'rxjs';
import { getChildNodeIndex } from '../utils';

@Directive({
  selector: '[libDropList]',
  standalone: true,
  exportAs: 'libDropList',
  host: {
    class: 'lib-drop-list',
  },
})
export class DropListDirective<T = any> {
  #dragNDropService = inject(DragNDropService);
  #ngZone = inject(NgZone);
  elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  dropped = output<LibDragDrop>({ alias: 'libDropListDropped' });
  connectedTo = input<DropListDirective[] | null>(null, {
    alias: 'libDropListConnectedTo',
  });
  dropData = input<Array<T> | null>(null, { alias: 'libDropListData' });

  get data() {
    return this.dropData();
  }

  private onDropItem() {
    return fromEvent(window, 'mouseup').pipe(
      filter(() => !!this.#dragNDropService.activeItem()),
      tap(() => {
        const item = this.#dragNDropService.activeItem();
        const index = this.#dragNDropService.dropItemIndex()!;
        const hoveredDropList = this.#dragNDropService.hoveredDropList();

        if (!hoveredDropList || hoveredDropList !== this) return;

        //Need to wait item animation moving to list to emit dropped item
        setTimeout(
          () =>
            this.dropped.emit({
              previousIndex: item?.index!,
              previousContainer: item?.dragNDropDirective.dropList!,
              container: this,
              currentIndex: index,
              item: item?.dragNDropDirective!,
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
        const target = (event.target as HTMLElement).closest(
          '.lib-drag'
        ) as HTMLElement;

        const dropList =
          this.#dragNDropService.activeItem()?.dragNDropDirective.dropList;

        if (
          dropList != this &&
          ((!!dropList?.connectedTo()?.length &&
            !dropList.connectedTo()?.includes(this)) ||
            (!!this.connectedTo()?.length && !dropList?.connectedTo()?.length))
        )
          return;

        const index = getChildNodeIndex(
          this.elRef.nativeElement.children,
          target
        );

        this.#dragNDropService.setDropItemIndex(index);

        if (
          this.#dragNDropService.hoveredDropList()?.elRef.nativeElement !==
          this.elRef.nativeElement
        ) {
          this.#ngZone.runOutsideAngular(() => {
            this.elRef.nativeElement.insertBefore(
              this.#dragNDropService.clonedItem()!,
              this.elRef.nativeElement.firstChild
            );
          });
        }

        this.#dragNDropService.setHoveredDropList(this);
      })
    );
  }

  constructor() {
    toObservable(this.#dragNDropService.activeItem)
      .pipe(
        filter((item) => !!item),
        switchMap(() => this.onMouseMove().pipe(takeUntil(this.onDropItem()))),
        takeUntilDestroyed()
      )
      .subscribe();
  }
}
