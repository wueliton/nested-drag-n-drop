import { computed, effect, Injectable, signal } from '@angular/core';
import { SwapySlotDirective } from '../directives/swapy-slot.directive';

@Injectable({
  providedIn: 'root',
})
export class SwapySlotService {
  activeSlot = signal<SwapySlotDirective | null>(null);
  dragging = signal(false);
}
