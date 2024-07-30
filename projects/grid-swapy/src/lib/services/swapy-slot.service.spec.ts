import { TestBed } from '@angular/core/testing';

import { SwapySlotService } from './swapy-slot.service';

describe('SwapySlotService', () => {
  let service: SwapySlotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SwapySlotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
