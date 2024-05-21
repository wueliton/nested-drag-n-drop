import {
  DestroyRef,
  Directive,
  ElementRef,
  OnInit,
  Renderer2,
  booleanAttribute,
  contentChild,
  inject,
  input,
  signal,
} from '@angular/core';
import { delay, filter, fromEvent, map, switchMap, takeUntil, tap } from 'rxjs';
import { DropListDirective } from './drop-list.directive';
import { DragNDropService } from '../drag-n-drop.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DragHandleDirective } from './drag-handle.directive';

@Directive({
  selector: '[libDragNDrop]',
  standalone: true,
  exportAs: 'libDrag',
  host: {
    class: 'lib-drag',
    '[class.lib-drag-disabled]': 'disabled()',
    '[class.lib-drag-dragging]': 'isDragging()',
    '[class.lib-drag-placeholder]': 'showingPlaceholder()',
  },
})
export class DragNDropDirective implements OnInit {
  #dragNDropService = inject(DragNDropService);
  #elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  #renderer = inject(Renderer2);
  #destroyRef = inject(DestroyRef);

  dragHandle = contentChild(DragHandleDirective);
  dropList = inject(DropListDirective, { optional: true });
  disabled = input(false, {
    alias: 'libDragDisabled',
    transform: booleanAttribute,
  });
  isDragging = signal(false);
  showingPlaceholder = signal(false);

  get elHandle() {
    return this.dragHandle()?.elRef.nativeElement ?? this.#elRef.nativeElement;
  }

  private setStyles(
    el: unknown,
    styles: { [k in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[k] }
  ) {
    Object.entries(styles).forEach(([key, value]) =>
      this.#renderer.setStyle(el, key, value)
    );
  }

  private freeDrag(event: MouseEvent) {
    const { transform } = window.getComputedStyle(this.#elRef.nativeElement);
    const { m41, m42 } = new WebKitCSSMatrix(transform);

    return fromEvent<MouseEvent>(window, 'mousemove').pipe(
      map((mouseMove) => ({
        x: mouseMove.clientX - event.clientX,
        y: mouseMove.clientY - event.clientY,
      })),
      tap((pos) => {
        this.setStyles(this.#elRef.nativeElement, {
          transform: `translate3d(${m41 + pos.x}px, ${m42 + pos.y}px, 0px)`,
        });
      }),
      takeUntil(
        fromEvent(window, 'mouseup').pipe(
          tap(() => {
            this.isDragging.set(false);
          })
        )
      )
    );
  }

  private dragWithDropList(event: MouseEvent) {
    this.showingPlaceholder.set(true);
    this.#dragNDropService.setActiveItem({
      dragNDropDirective: this,
      index: Array.from(this.#elRef.nativeElement.parentNode!.children).indexOf(
        this.#elRef.nativeElement
      ),
    });

    const rect = (
      this.#elRef.nativeElement as HTMLElement
    ).getBoundingClientRect();
    const { left, top } = rect;
    const { clone, backdrop } = this.initializePlaceholder(rect);
    this.#dragNDropService.setClonedItem(this.#elRef.nativeElement);

    return fromEvent<MouseEvent>(window, 'mousemove').pipe(
      tap((mouseMove) => {
        if (!this.isDragging()) return;

        this.setStyles(clone, {
          transform: `translate3d(${Math.round(
            left + mouseMove.clientX - event.clientX
          )}px, ${Math.round(top + mouseMove.clientY - event.clientY)}px, 0px)`,
        });
      }),
      takeUntil(this.mouseUp(clone, backdrop))
    );
  }

  private mouseUp(clone: HTMLElement, backdrop: HTMLElement) {
    return fromEvent<MouseEvent>(window, 'mouseup').pipe(
      tap(() => {
        const { left, top } = this.#elRef.nativeElement.getBoundingClientRect();
        this.isDragging.set(false);

        this.#renderer.setStyle(clone, 'transition', 'transform 0.2s');
        this.setStyles(clone, {
          transform: `translate3d(${left}px, ${top}px, 0px)`,
        });
      }),
      delay(210),
      tap(() => {
        this.showingPlaceholder.set(false);
        this.#dragNDropService.reset();
        this.#renderer.removeChild(document.body, backdrop);
      })
    );
  }

  private initializePlaceholder({ height, width, left, top }: DOMRect) {
    const backdrop = this.#renderer.createElement('div');
    this.setStyles(backdrop, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });
    const clone = (this.#elRef.nativeElement as HTMLElement).cloneNode(
      true
    ) as HTMLElement;

    this.#renderer.addClass(clone, 'lib-drag-preview');

    this.setStyles(clone, {
      pointerEvents: 'none',
      position: 'absolute',
      margin: '0',
      left: '0',
      top: '0',
      height: `${height}px`,
      width: `${width}px`,
      transform: `translate3d(${left}px, ${top}px, 0px)`,
    });

    this.#renderer.appendChild(backdrop, clone);
    this.#renderer.appendChild(document.body, backdrop);

    return { clone, backdrop };
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.dropList) return this.freeDrag(event);
    return this.dragWithDropList(event);
  }

  ngOnInit() {
    fromEvent<MouseEvent>(this.elHandle, 'mousedown')
      .pipe(
        filter((event) => event.button === 0),
        tap((event) => {
          event.preventDefault();
          event.stopPropagation();

          this.#dragNDropService.setHoveredDropList(this.dropList);
          this.isDragging.set(true);
        }),
        switchMap((event) => this.onMouseMove(event)),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
  }
}
