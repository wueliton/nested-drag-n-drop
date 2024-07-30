import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, fromEvent, switchMap, tap } from 'rxjs';
import { SwapySlotService } from '../services/swapy-slot.service';
import { SwapySlotComponent } from '../swapy-slot/swapy-slot.component';

@Directive({
  selector: '[libSwapySlot]',
  host: {
    '[class.active-swapy]': 'active()',
  },
  standalone: true,
})
export class SwapySlotDirective {
  #swapySlotService = inject(SwapySlotService);
  #slotComponent = inject(SwapySlotComponent, { host: true });
  elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  swapy = this.#slotComponent.swapy;
  get rectBounding() {
    return this.elRef.nativeElement.getBoundingClientRect();
  }
  disabled = input(false, { transform: booleanAttribute });
  disableDrop = input(false, { transform: booleanAttribute });
  active = computed(() => this.#swapySlotService.activeSlot() === this);
  isDragging$ = toObservable(this.#swapySlotService.dragging);

  constructor() {
    this.isDragging$
      .pipe(
        filter(
          (isDragging) =>
            !!isDragging && !this.disabled() && !this.disableDrop()
        ),
        switchMap(() =>
          fromEvent<MouseEvent>(this.elRef.nativeElement, 'mouseenter').pipe(
            tap(() => {
              if (!this.#swapySlotService.dragging()) return;
              this.#swapySlotService.activeSlot.set(this);
            })
          )
        )
      )
      .pipe(takeUntilDestroyed())
      .subscribe();
  }
}
