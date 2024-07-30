import { Component, contentChild, viewChild } from '@angular/core';
import { SwapyDirective } from '../directives/swapy.directive';
import { SwapySlotDirective } from '../directives/swapy-slot.directive';

@Component({
  selector: 'lib-swapy-slot',
  standalone: true,
  imports: [SwapyDirective],
  templateUrl: './swapy-slot.component.html',
  styleUrl: './swapy-slot.component.css',
  hostDirectives: [
    {
      directive: SwapySlotDirective,
      inputs: ['disabled', 'disableDrop'],
    },
  ],
})
export class SwapySlotComponent {
  swapy = viewChild.required(SwapyDirective);
}
