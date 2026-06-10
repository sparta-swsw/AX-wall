'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';

function isInteractiveElement(el: EventTarget | null): boolean {
  const tags = ['button', 'input', 'textarea', 'select', 'a'];
  let node = el as HTMLElement | null;
  while (node) {
    if (tags.includes(node.tagName?.toLowerCase())) return true;
    node = node.parentElement;
  }
  return false;
}

class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: { nativeEvent: PointerEvent }) => {
        if (!event.isPrimary || event.button !== 0 || isInteractiveElement(event.target)) return false;
        return true;
      },
    },
  ];
}
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, AuthUser } from '@/types';
import LinkCard from './LinkCard';

type Member = { id: string; name: string; avatar_url?: string | null };

interface SortableItemProps {
  link: Link;
  currentUser: AuthUser;
  color: { bg: string; border: string };
  members: Member[];
  onDelete: (id: string) => void;
  onUpdate: (link: Link) => void;
}

function SortableItem({ link, currentUser, color, members, onDelete, onUpdate }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="relative group/card"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-400 cursor-grab active:cursor-grabbing shadow-sm border border-gray-200 text-sm font-bold opacity-0 group-hover/card:opacity-100 transition-opacity"
        style={{ touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </div>
      <LinkCard link={link} currentUser={currentUser} color={color} members={members} onDelete={onDelete} onUpdate={onUpdate} />
    </div>
  );
}

interface Props {
  links: Link[];
  currentUser: AuthUser;
  isOwner: boolean;
  color: { bg: string; border: string };
  members: Member[];
  onDelete: (id: string) => void;
  onUpdate: (link: Link) => void;
  onReorder: (reordered: Link[]) => void;
}

export default function SortableCardGrid({ links, currentUser, isOwner, color, members, onDelete, onUpdate, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(SmartPointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);

    onReorder(reordered);

    const updates = reordered.map((link, i) => ({
      id: link.id,
      sort_order: (reordered.length - i) * 1000,
    }));

    await fetch('/api/links/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
  };

  if (!isOwner) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {links.map((link) => (
          <div key={link.id}>
            <LinkCard link={link} currentUser={currentUser} color={color} members={members} onDelete={onDelete} onUpdate={onUpdate} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={links.map((l) => l.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {links.map((link) => (
            <SortableItem
              key={link.id}
              link={link}
              currentUser={currentUser}
              color={color}
              members={members}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
