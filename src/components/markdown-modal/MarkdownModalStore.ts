import { objectHash } from '../../modules/object-hash/object-hash'
import { openModal } from '../backdrop/BackdropStore2'
import { writable } from 'svelte/store'
import { Lang } from '../../store/lang'

export type MarkdownModalStoreProps = {
  title?: string
  path?: string
  // Where the Reply button writes to. Defaults to the Happy Data support address.
  replyTo?: string
}

export const MarkdownModalStore = writable<MarkdownModalStoreProps | undefined>(undefined)

export const openMarkdownModal = async (props: MarkdownModalStoreProps) => {
  // the viewer and its markdown parser load when they open
  const { default: MarkdownModal } = await import('./markdown-modal.svelte')
  openModal({
    id: `markdown-${objectHash(props.path)}`,
    component: MarkdownModal,
    position: 'fullscreen',
    componentProps: {
      props,
    },
  })
}

export const closeMarkdownModal = () => {
  MarkdownModalStore.update((s) => undefined)
}

export const openTermsOfService = async () => {
  openMarkdownModal({
    title: Lang.t('ui.terms-of-service', 'Terms of Service'),
    path: '/content/terms.md',
  })
}

export const openPrivacyPolicy = async () => {
  openMarkdownModal({
    title: Lang.t('ui.privacy-policy', 'Privacy Policy'),
    path: '/content/privacy.md',
    replyTo: 'dailynomie@gmail.com',
  })
}
