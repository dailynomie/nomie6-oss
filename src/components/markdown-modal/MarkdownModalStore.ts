import MarkdownModal from './markdown-modal.svelte'
import { objectHash } from '../../modules/object-hash/object-hash'
import { openModal } from '../backdrop/BackdropStore2'
import { writable } from 'svelte/store'

export type MarkdownModalStoreProps = {
  title?: string
  path?: string
  // Where the Reply button writes to. Defaults to the Happy Data support address.
  replyTo?: string
}

export const MarkdownModalStore = writable<MarkdownModalStoreProps | undefined>(undefined)

export const openMarkdownModal = (props: MarkdownModalStoreProps) => {
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

export const openTermsOfService = () => {
  openMarkdownModal({
    title: 'Terms of Service',
    path: '/content/terms.md',
  })
}

export const openPrivacyPolicy = () => {
  openMarkdownModal({
    title: 'Privacy Policy',
    path: '/content/privacy.md',
    replyTo: 'dailynomie@gmail.com',
  })
}
