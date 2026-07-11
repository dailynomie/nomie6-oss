# Context Tracker Bug Fixes - Report

## Summary

Fixed critical bugs in context tracker import and storage that prevented:
1. Context trackers from being imported from backups (showing as null objects)
2. New context trackers from being saved/persisted properly

## Bugs Found and Fixed

### Bug #1: Incorrect Data Format in Import Normalizer
**File:** `src/modules/import/import.n5.ts`

**Problem:**
The `N5ImportNormalizer` was passing `importer.context` directly without transformation:
```typescript
context: importer.context || [],
```

However, context data in backup files is stored as an array of objects:
```json
[
  {"tag":"nomie","duration":1,"label":"nomie","emoji":"📍","color":"#00BFA5"},
  {"tag":"frankrijk2024","duration":14,"label":"frankrijk2024","emoji":"📍","color":"#6D4C41"}
]
```

When imported, this should be properly formatted for the ContextClass.

**Fix Applied:**
Created `getContexts()` and `getPointers()` helper functions to handle both array and object formats:
```typescript
function getContexts(fileData: any): Array<any> {
  const contextData = fileData.context || []
  
  // If it's an object (key-value), convert to array
  if (!Array.isArray(contextData)) {
    return Object.values(contextData)
  }
  
  return contextData
}
```

### Bug #2: Incorrect Data Structure for KVStore.upsertMany()
**File:** `src/modules/import/import-loader.ts`

**Problem:**
The `importContext()` function was calling:
```typescript
const contexts = importCTX.map((c) => new ContextClass(c))
await ContextStore.upsertMany(contexts)  // ❌ Passing array instead of object
```

But `ContextStore.upsertMany()` expects a **key-value object**, not an array:
- Expected: `{ "tag1": ContextClass, "tag2": ContextClass, ...}`
- Provided: `[ContextClass, ContextClass, ...]`

This caused the upsert to fail silently, resulting in null objects in storage.

**Fix Applied:**
Convert array to key-value object with `tag` as the key:
```typescript
public async importContext() {
  let importCTX = this.normalized.context || []
  const contextMap: { [key: string]: ContextClass } = {}

  importCTX.forEach((c) => {
    const contextClass = new ContextClass(c)
    if (contextClass.tag) {
      contextMap[contextClass.tag] = contextClass
    }
  })

  try {
    if (Object.keys(contextMap).length > 0) {
      await ContextStore.upsertMany(contextMap)  // ✅ Passing object
    }
  } catch (e) {
    console.error('Error importing contexts:', e)
  }
  return this
}
```

Same fix applied to `importPointers()` function.

### Bug #3: smartMerge Not Recognizing 'tag' as ID Field
**File:** `src/domains/storage/smart-merge.ts`

**Problem:**
The `mergeArray` function looked for ID fields: `['_id', 'key', 'id']`

But context and pointer objects use `'tag'` as their unique identifier. When importing backups that needed merging, contexts and pointers weren't being properly deduplicated.

**Fix Applied:**
Added 'tag' to the list of recognized ID fields:
```typescript
const KEYS = ['_id','key','id','tag'];  // Added 'tag' here
```

Now during backup import, if a context or pointer with the same tag exists, it will properly merge the data instead of creating duplicates.

## Files Modified

1. **src/modules/import/import.n5.ts**
   - Added `getContexts()` helper function
   - Added `getPointers()` helper function
   - Updated export function to use new helpers

2. **src/modules/import/import-loader.ts**
   - Fixed `importContext()` to convert array to key-value object
   - Fixed `importPointers()` to convert array to key-value object
   - Added error handling with descriptive messages

3. **src/domains/storage/smart-merge.ts**
   - Added 'tag' to recognized ID fields for array merging

## Testing

After applying these fixes:

1. **Import from backup:** Context trackers should now import correctly without null values
2. **Create new context:** New contexts should be saved and persist properly
3. **Merge during import:** Existing contexts with the same tag will be properly merged

### How to Test

1. **Test Import:**
   - Create a backup (Settings → Export Data)
   - Import it back using the import function
   - Verify all context trackers appear correctly with their metadata

2. **Test Creation:**
   - Create a new context tracker (if applicable through the UI)
   - Save it
   - Verify it appears in the context tracker list

## Related Code Patterns

The context tracker system uses:
- **KVStore:** Key-value store where items are indexed by their `tag` property
- **ContextClass:** Represents a single context with properties: tag, label, duration, emoji, color, avatar
- **Trackable:** Wrapper that can contain a ContextClass as `ctx` property

When saving contexts:
- Via import: Must convert array to key-value object
- Via UI: Save through `ContextStore.upsert(trackable.ctx)`
- Storage format: `context.json` contains a key-value object indexed by tag

## Additional Notes

- The same issue existed for pointers, which were fixed with the same pattern
- The smartMerge fix ensures that on import, existing contexts aren't duplicated
- Error handling was improved to log specific errors during import

