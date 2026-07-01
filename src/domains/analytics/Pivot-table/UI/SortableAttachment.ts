import Sortable from 'sortablejs';
import { tick } from 'svelte';

interface SortableActionParams {
    options?: any;
    onchange: (v: (string | undefined)[]) => void;
}

export default function (node: HTMLElement, params: SortableActionParams) {
    const { options = {}, onchange } = params;

    const notify = (el: HTMLElement) => {
        const val = Array.from(el.children).map((i) => (i as HTMLElement).dataset.id);
        onchange(val);
    };

    // Handle dragover to accept drops
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
    };

    if (node) {
        node.addEventListener('dragover', handleDragOver);

        const sortable = Sortable.create(node, {
            ...options,
            onStart({ item }) {
                const oldIndex = Array.prototype.indexOf.call(item.parentNode?.childNodes, item);
                (item as HTMLElement).dataset.oldIndex = String(oldIndex);
            },
            onUpdate: (ev) => notify(ev.to),
            onAdd: (ev) => notify(ev.to),
            onRemove: (ev) => notify(ev.from),
            onEnd: (ev) => {
                // sortablejs doesn't work perfectly with Svelte5
                // https://github.com/sveltejs/svelte/issues/11826#issuecomment-2141791882

                // cancel the UI update so Svelte will take care of it
                ev.item.remove();

                // Only restore position if item stayed in same container (reordering within same list)
                if (ev.from === ev.to && ev.oldIndex !== undefined) {
                    ev.from.insertBefore(ev.item, ev.from.childNodes[Number((ev.item as HTMLElement).dataset.oldIndex!)]);
                }
            },
        });

        return {
            destroy() {
                sortable?.destroy();
                node.removeEventListener('dragover', handleDragOver);
            },
        };
    }
}
