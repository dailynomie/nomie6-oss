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

    if (node) {
        const sortable = Sortable.create(node, {
            ...options,
            onStart({ item }) {
                const oldIndex = Array.prototype.indexOf.call(item.parentNode?.childNodes, item);
                (item as HTMLElement).dataset.oldIndex = String(oldIndex);
            },
            onUpdate: (ev) => notify(ev.to),
            onAdd: (ev) => notify(ev.to),
            onRemove: (ev) => notify(ev.from),
            onEnd: async (ev) => {
                // sortablejs doesn't work perfectly with Svelte5
                // https://github.com/sveltejs/svelte/issues/11826#issuecomment-2141791882

                // Wait for Svelte to process state updates before removing the element
                await tick();

                ev.item.remove();

                // Only restore position if item stayed in the same container (reordering)
                if (ev.from === ev.to && ev.oldIndex !== undefined) {
                    ev.from.insertBefore(ev.item, ev.from.childNodes[Number((ev.item as HTMLElement).dataset.oldIndex!)]);
                }
            },
        });

        return {
            destroy() {
                sortable?.destroy();
            },
        };
    }
}
