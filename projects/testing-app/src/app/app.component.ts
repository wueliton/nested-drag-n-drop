import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DragHandleDirective,
  DragNDropDirective,
  DropGroupDirective,
  DropListDirective,
  LibDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragPreviewDirective,
} from 'drag-n-drop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DragNDropDirective,
    DropListDirective,
    DragHandleDirective,
    NgTemplateOutlet,
    DropGroupDirective,
    DragPreviewDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'testing-app';
  items = signal([
    {
      id: 1,
    },
    {
      id: 2,
    },
    {
      id: 3,
      items: [
        {
          id: 4,
        },
        {
          id: 5,
        },
        {
          id: 6,
          items: [
            {
              id: 7,
            },
            {
              id: 8,
            },
          ],
        },
      ],
    },
  ]);

  todoItems = signal([
    {
      id: 2,
    },
    {
      id: 3,
    },
  ]);

  devItems = signal([
    {
      id: 4,
    },
    {
      id: 5,
    },
  ]);

  doneItems = signal<{ id: number }[]>([]);

  private removeNestedItem<T extends Array<any> | Object>(
    array: Array<T>,
    item: T
  ) {
    array.forEach((curr, index) => {
      if (curr === item) {
        array.splice(index, 1);
        return;
      }
      if (typeof curr === 'object') {
        Object.values(curr).forEach((obj) => {
          if (Array.isArray(obj)) this.removeNestedItem(obj, item);
        });
      }
    });
  }

  dropped(event: LibDragDrop<{ id: number }>) {
    if (event.previousContainer !== event.container) {
      transferArrayItem(
        event.previousContainer.data!,
        event.container.data!,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      moveItemInArray(
        event.container.data!,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  droppedConnected(event: LibDragDrop) {
    if (event.previousContainer !== event.container) {
      transferArrayItem(
        event.previousContainer.data!,
        event.container.data!,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      moveItemInArray(
        event.container.data!,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
