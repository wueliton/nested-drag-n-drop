import { Injectable, signal } from '@angular/core';
import { DragNDropDirective, DropListDirective } from '../public-api';

export type LibDragDrop<T = any> = {
  previousIndex: number;
  currentIndex: number;
  item: DragNDropDirective;
  container: DropListDirective<T>;
  previousContainer: DropListDirective<T>;
};

export type DragItem<T = any> = {
  dragNDropDirective: DragNDropDirective;
  index: number;
};

@Injectable({
  providedIn: 'root',
})
export class DragNDropService {
  #activeItem = signal<DragItem | null>(null);
  #hoveredDropList = signal<DropListDirective | null>(null);
  #clonedItem = signal<HTMLElement | null>(null);
  #dropItemIndex = signal<number | null>(null);
  #dropItemPosition = signal<DOMRect | null>(null);
  #placeholderInitialIndex = signal<number | null>(null);
  #isDraggingToUp = signal(false);

  activeItem = this.#activeItem.asReadonly();
  hoveredDropList = this.#hoveredDropList.asReadonly();
  clonedItem = this.#clonedItem.asReadonly();
  dropItemIndex = this.#dropItemIndex.asReadonly();
  dropItemPosition = this.#dropItemPosition.asReadonly();
  placeholderInitialIndex = this.#placeholderInitialIndex.asReadonly();
  isDraggingToUp = this.#isDraggingToUp.asReadonly();

  setActiveItem(item: DragItem | null) {
    this.#activeItem.set(item);
  }

  setHoveredDropList(item: DropListDirective | null) {
    this.#hoveredDropList.set(item);
  }

  setClonedItem(item: HTMLElement | null) {
    this.#clonedItem.set(item);
  }

  setDropItemIndex(index: number | null) {
    this.#dropItemIndex.set(index);
  }

  setDropItemPosition(rect: DOMRect) {
    this.#dropItemPosition.set(rect);
  }

  setPlaceholderInitialIndex(index: number) {
    this.#placeholderInitialIndex.set(index);
  }

  setIsDraggingToUp(isUpPosition: boolean) {
    this.#isDraggingToUp.set(isUpPosition);
  }

  reset() {
    this.#activeItem.set(null);
    this.#hoveredDropList.set(null);
    this.#clonedItem.set(null);
    this.#dropItemPosition.set(null);
    this.#dropItemIndex.set(null);
    this.#placeholderInitialIndex.set(null);
  }
}
