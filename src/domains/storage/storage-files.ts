import Storage from './storage'

/**
 * The storage layer's file operations for screens and modals. Screens call these, not the
 * storage facade directly (guardrails STO-01).
 */
export const listStorageFiles = () => Storage.list()
export const readStorageFile = (path: string) => Storage.get(path)
export const writeStorageFile = (path: string, content: any) => Storage.put(path, content)
export const deleteStorageFile = (path: string) => Storage.delete(path)
export const onStorageReady = (callback: () => void) => Storage.getEngine().onReady(callback)
export const initStorage = () => Storage.init()
export const storageRootPath = (): string => Storage.getEngine().basePath()
