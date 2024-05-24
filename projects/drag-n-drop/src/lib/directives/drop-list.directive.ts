import {
  Directive,
  ElementRef,
  InjectionToken,
  Renderer2,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DragNDropService, LibDragDrop } from '../drag-n-drop.service';
import { delay, filter, fromEvent, map, switchMap, takeUntil, tap } from 'rxjs';
import { getChildNodeIndex } from '../utils';
import { DropGroupDirective } from './drop-group.directive';

export const LIB_DROP_LIST = new InjectionToken<DropListDirective>(
  'LIB_DROP_LIST'
);

@Directive({
  selector: '[libDropList]',
  standalone: true,
  exportAs: 'libDropList',
  host: {
    class: 'lib-drop-list',
    '[class.lib-drag-dragging-list]': 'isDragging()',
  },
  providers: [
    {
      provide: LIB_DROP_LIST,
      useExisting: DropListDirective,
    },
  ],
})
export class DropListDirective<T = any> {
  #dragNDropService = inject(DragNDropService);
  #renderer = inject(Renderer2);
  dropGroup = inject(DropGroupDirective, { optional: true });
  elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  dropped = output<LibDragDrop<T>>({ alias: 'libDropListDropped' });
  connectedTo = input<DropListDirective<any>[] | null>(null, {
    alias: 'libDropListConnectedTo',
  });
  dropData = input<Array<T> | null>(null, { alias: 'libDropListData' });
  isDragging = computed(() => !!this.#dragNDropService.activeItem());

  get data() {
    return this.dropData();
  }

  private onDropItem() {
    return fromEvent(window, 'mouseup').pipe(
      filter(
        () =>
          !!this.#dragNDropService.activeItem() &&
          this.#dragNDropService.hoveredDropList() === this
      ),
      map(() => {
        const item = this.#dragNDropService.activeItem();
        const index = this.#dragNDropService.dropItemIndex()!;

        return { item, index };
      }),
      delay(230),
      tap(({ item, index }) => {
        this.dropped.emit({
          previousIndex: item?.index!,
          previousContainer: item?.dragNDropDirective.dropList!,
          container: this,
          currentIndex: index,
          item: item?.dragNDropDirective!,
        });
        this.removeAnimation(
          Array.from(this.elRef.nativeElement.children),
          true
        );
      })
    );
  }

  private onMouseMove() {
    return fromEvent<MouseEvent>(this.elRef.nativeElement, 'mouseover').pipe(
      tap((event) => {
        event!.stopPropagation();

        if (!this.#dragNDropService.activeItem()) return;

        const target = (event!.target as HTMLElement).closest('.lib-drag');
        const childIndex = getChildNodeIndex(
          this.elRef.nativeElement.children,
          target
        );
        const itemIndex = childIndex < 0 ? 0 : childIndex;
        const hoveredDropList = this.#dragNDropService.hoveredDropList();

        if (hoveredDropList !== this) {
          this.#dragNDropService.setHoveredDropList(this);
          this.removeAnimation(
            Array.from(hoveredDropList?.elRef.nativeElement.children ?? []),
            true
          );

          const isChild = Array.from(
            this.elRef.nativeElement.children
          ).includes(target!);

          this.elRef.nativeElement.insertBefore(
            this.#dragNDropService.clonedItem()!,
            isChild ? target : this.elRef.nativeElement.firstChild
          );
          this.#dragNDropService.setDropItemIndex(itemIndex);
          this.#dragNDropService.setPlaceholderInitialIndex(itemIndex);

          return;
        }

        if (childIndex === -1) return;

        if (target !== this.#dragNDropService.clonedItem())
          this.animateItens(childIndex!);
      })
    );
  }

  private animateItens(childIndex: number) {
    let isUpPosition = this.#dragNDropService.isDraggingToUp();

    if (childIndex === this.#dragNDropService.dropItemIndex()) {
      childIndex = isUpPosition ? childIndex + 1 : childIndex - 1;
    }

    this.#dragNDropService.setDropItemIndex(childIndex);

    const placeholderInitialIndex =
      this.#dragNDropService.placeholderInitialIndex()!;

    isUpPosition = placeholderInitialIndex > childIndex;
    this.#dragNDropService.setIsDraggingToUp(isUpPosition);
    const elementChilds = Array.from(this.elRef.nativeElement.children);
    const firstItem = Math.min(childIndex, placeholderInitialIndex);
    const lastItem = Math.max(childIndex, placeholderInitialIndex);

    const animatedItens = elementChilds.splice(
      isUpPosition ? firstItem : firstItem + 1,
      lastItem - firstItem
    );
    const { height } = (
      this.#dragNDropService.clonedItem() as HTMLElement
    ).getBoundingClientRect();

    let placeholderPosition = 0;

    animatedItens.forEach((el) => {
      if (el === this.#dragNDropService.clonedItem()) return;
      const { height: elHeight } = (el as HTMLElement).getBoundingClientRect();
      this.applyTransform(el, isUpPosition ? height : height * -1);
      placeholderPosition += isUpPosition ? elHeight * -1 : elHeight;
    });

    this.removeAnimation(elementChilds);

    this.applyTransform(
      this.elRef.nativeElement.children[placeholderInitialIndex],
      placeholderPosition
    );
  }

  private removeAnimation(elements: Element[], removeTransition?: boolean) {
    elements.forEach((el) => {
      this.#renderer.removeStyle(el, 'transform');
      if (removeTransition) this.#renderer.removeStyle(el, 'transition');
    });
  }

  private applyTransform(el: HTMLElement | Node, x: number) {
    this.#renderer.setStyle(el, 'transition', 'transform 0.2s');
    this.#renderer.setStyle(el, 'transform', `translate3d(0px, ${x}px, 0px)`);
  }

  constructor() {
    toObservable(this.#dragNDropService.activeItem)
      .pipe(
        filter((item) => {
          const dropList = item?.dragNDropDirective.dropList;
          const dropDirectives =
            item?.dragNDropDirective.dropList?.dropGroup?.dropDirectives() ??
            item?.dragNDropDirective.dropList?.connectedTo();

          return (
            !!item &&
            ((!!dropDirectives && dropDirectives.includes(this)) ||
              dropList === this)
          );
        }),
        switchMap(() => this.onMouseMove().pipe(takeUntil(this.onDropItem()))),
        takeUntilDestroyed()
      )
      .subscribe();
  }
}
