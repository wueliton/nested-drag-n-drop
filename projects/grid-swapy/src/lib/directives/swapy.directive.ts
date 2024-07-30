import {
  Directive,
  ElementRef,
  inject,
  model,
  Renderer2,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  delay,
  filter,
  fromEvent,
  merge,
  pairwise,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { SwapySlotService } from '../services/swapy-slot.service';
import { SwapySlotDirective } from './swapy-slot.directive';

@Directive({
  selector: '[libSwapy]',
  host: {
    class: 'lib-swapy',
    '[class.lib-drag-disabled]': 'disabled()',
    '[class.lib-drag-dragging]': 'isDragging()',
    '[class.lib-drag-placeholder]': 'showingPlaceholder()',
  },
  standalone: true,
})
export class SwapyDirective {
  #renderer = inject(Renderer2);
  #swapySlot = inject(SwapySlotDirective);
  #swapySlotService = inject(SwapySlotService);
  #activeSlot$ = toObservable(this.#swapySlotService.activeSlot);
  elRef = inject<ElementRef<HTMLDivElement>>(ElementRef);
  isDragging = this.#swapySlotService.dragging;
  showingPlaceholder = signal(false);
  disabled = model(false);

  constructor() {
    fromEvent<MouseEvent>(this.elRef.nativeElement, 'mousedown')
      .pipe(
        filter(
          (event) =>
            event.button === 0 &&
            !this.#swapySlotService.activeSlot() &&
            !!this.#swapySlot.swapy().elRef.nativeElement.childNodes.length &&
            !this.#swapySlot.disabled()
        ),
        tap((event) => {
          event.preventDefault();
          event.stopPropagation();
          this.#swapySlotService.activeSlot.set(this.#swapySlot);
        }),
        switchMap((event) => this.onMouseMove$(event)),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  private setStyles(
    el: unknown,
    styles: { [k in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[k] }
  ) {
    Object.entries(styles).forEach(([key, value]) =>
      this.#renderer.setStyle(el, key, value)
    );
  }

  private onMouseMove$(mouseDown: MouseEvent) {
    const { clone, backdrop } = this.initializePlaceholder();
    const { left, top } = this.elRef.nativeElement.getBoundingClientRect();
    this.isDragging.set(true);

    return merge(
      fromEvent<MouseEvent>(window, 'mousemove').pipe(
        tap((mouseMove) => {
          if (!this.isDragging()) return;

          this.setStyles(clone, {
            transform: `translate3d(${Math.round(
              left + mouseMove.clientX - mouseDown.clientX
            )}px, ${Math.round(
              top + mouseMove.clientY - mouseDown.clientY
            )}px, 0px)`,
          });
        })
      ),
      this.#activeSlot$.pipe(
        filter((activeSlot) => !!activeSlot),
        pairwise(),
        tap(([previousSlot, activeSlot]) =>
          this.swapContent(clone, previousSlot, activeSlot)
        ),
        delay(200),
        tap(([previousSlot]) => {
          if (!previousSlot) return;
          this.setStyles(previousSlot.swapy().elRef.nativeElement, {
            pointerEvents: 'initial',
            width: 'auto',
            height: 'auto',
          });
        })
      )
    ).pipe(takeUntil(this.onMouseUp$(clone, backdrop)));
  }

  private onMouseUp$(clone: HTMLElement, backdrop: HTMLElement) {
    return fromEvent<MouseEvent>(document, 'mouseup').pipe(
      tap(() => {
        this.isDragging.set(false);

        const { left, top } =
          this.#swapySlotService.activeSlot()?.rectBounding ?? {};
        this.#renderer.setStyle(clone, 'transition', 'transform 0.2s');
        setTimeout(
          () =>
            this.setStyles(clone, {
              transform: `translate3d(${left}px, ${top}px, 0px)`,
            }),
          10
        );
      }),
      delay(200),
      tap(() => {
        this.#renderer.removeChild(document.body, backdrop);
        this.#swapySlotService.activeSlot.set(null);
      })
    );
  }

  private swapContent(
    clone: HTMLElement,
    prevSlot: SwapySlotDirective | null,
    activeSlot: SwapySlotDirective | null
  ) {
    if (!prevSlot || !activeSlot) return;
    const { width, height } = activeSlot!.rectBounding;
    this.setStyles(clone, {
      height: `${height}px`,
      width: `${width}px`,
    });

    const prevSwapy = prevSlot.swapy();
    const activeSwapy = activeSlot.swapy();

    const previousElement = prevSwapy.elRef.nativeElement;
    const previousSize = prevSlot.elRef.nativeElement.getBoundingClientRect();
    const activeElement = activeSwapy.elRef.nativeElement;
    const activeSize = activeSlot.elRef.nativeElement.getBoundingClientRect();

    const slotToAnimate = previousElement;

    const prevContent = previousElement.innerHTML;
    const nextContent = activeElement.innerHTML;
    prevSlot.swapy().elRef.nativeElement.innerHTML = nextContent;
    activeSlot.swapy().elRef.nativeElement.innerHTML = prevContent;

    let left =
      Math.max(previousSize.left, activeSize.left) -
      Math.min(previousSize.left, activeSize.left);
    left = previousSize.left > activeSize.left ? left * -1 : left;
    let top =
      Math.max(previousSize.top, activeSize.top) -
      Math.min(previousSize.top, activeSize.top);
    top = previousSize.top > activeSize.top ? top * -1 : top;

    this.setStyles(previousElement, {
      pointerEvents: 'none',
    });

    this.setStyles(slotToAnimate, {
      transform: `translate3d(${left}px, ${top}px, 0px)`,
      width: `${activeSize.width}px`,
      height: `${activeSize.height}px`,
      transition: 'none',
    });

    setTimeout(() => {
      this.setStyles(slotToAnimate, {
        transform: `translate3d(0px, 0px, 0px)`,
        width: `${previousSize.width}px`,
        height: `${previousSize.height}px`,
        transition: 'width 0.2s, height 0.2s, transform 0.2s',
      });
    }, 10);
  }

  private initializePlaceholder() {
    const element = this.elRef.nativeElement;
    const backdrop = this.#renderer.createElement('div');
    const { left, top, width, height } = element.getBoundingClientRect();
    this.setStyles(backdrop, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });

    const clone = element.cloneNode(true) as HTMLElement;

    this.setStyles(clone, {
      pointerEvents: 'none',
      position: 'absolute',
      margin: '0',
      left: '0',
      top: '0',
      transform: `translate3d(${left}px, ${top}px, 0px)`,
      height: `${height}px`,
      width: `${width}px`,
      transition: 'width 0.2s, height 0.2s',
    });

    this.#renderer.addClass(clone, 'swapy-placeholder');

    this.#renderer.appendChild(backdrop, clone);
    this.#renderer.appendChild(document.body, backdrop);
    return { clone, backdrop };
  }
}
