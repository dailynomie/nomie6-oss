<svelte:options runes={true} />

<script lang="ts">
  import type { NLog } from './../../nomie-log/nomie-log'

  import { wait } from './../../../utils/tick/tick'
  import { Interact } from './../../../store/interact'
  import { getDateFormats } from './../../preferences/Preferences'
  import NextPrevCal from './../../../components/next-prev-cal/next-prev-cal.svelte'
  import ToggleSwitch from './../../../components/toggle-switch/toggle-switch.svelte'
  import FileUploader from './../../../components/file-uploader/file-uploader.svelte'

  import ImportLoader from '../../../modules/import/import-loader'
  import { navigate } from '../../../vendor/svelte-navigator'
  import { truncateText } from '../../../utils/text/text'
  import CSVRImport, { CsvTemplateStore, type IImportConfig } from './csv-import-helper'
  import { onMount } from 'svelte'

  import Button from '../../../components/button/button.svelte'
  import ListItem from '../../../components/list-item/list-item.svelte'
  import Text from '../../../components/text/text.svelte'
  import { Lang } from '../../../store/lang'
  import Input from '../../../components/input/input.svelte'

  import dayjs from 'dayjs'
  import IonIcon from '../../../components/icon/ion-icon.svelte'
  import ChevronDownOutline from '../../../n-icons/ChevronDownOutline.svelte'
  import AddCircleOutline from '../../../n-icons/AddCircleOutline.svelte'
  import ListItemLog from '../../../components/list-item-log/list-item-log.svelte'
  import { showToast } from '../../../components/toast/ToastStore'
  import is from '../../../utils/is/is'

  import { closeModal } from '../../../components/backdrop/BackdropStore2'
  import BackdropModal from '../../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../../components/toolbar/toolbar-grid.svelte'
  import Divider from '../../../components/divider/divider.svelte'

  let { id, fileUpload = $bindable() } = $props()

  let stepId: string = $state('home')
  let templates: Array<IImportConfig> = $state([])
  let activeImporter: CSVRImport = $state(undefined)
  let activeMapIndex = $state(undefined)
  let previewIndex = $state(0)
  let previewRow: Array<any> = $state(undefined)
  let refreshing = $state(false)
  let previewLog: NLog = $state(undefined)
  let listMode = $state('list')
  let expandFields = $state(false)

  if (fileUpload) {
    activeImporter = activeImporter || new CSVRImport({})
    activeImporter.csv(fileUpload.data)
    activeImporter.setName(fileUpload.file.name)
    stepId = 'note'
  }

  $effect(() => {
    if (activeImporter && activeImporter.parsed && activeImporter.parsed.data) {
      if (activeImporter.length() > 1 && previewIndex == 0) {
        previewIndex = 1
      }
      previewRow = activeImporter.parsed.data[previewIndex]
      previewLog = activeImporter.toLog(previewRow)
    }
  })

  async function nextPreview() {
    let current = previewIndex + 0
    previewIndex == undefined
    if (current < activeImporter.length() - 1) {
      previewIndex = current + 1
    } else {
      previewIndex = 0
    }
  }
  async function previousPreview() {
    let current = previewIndex + 0
    previewIndex == undefined
    if (current !== 1) {
      previewIndex = current - 1
    } else {
      previewIndex = activeImporter.length() - 1
    }
  }

  let views = $state([
    {
      title: Lang.t('import.import-csv', 'Import CSV'),
      id: 'home',
    },
    {
      title: Lang.t('import.compose-note', 'Compose Note'),
      id: 'note',
    },
    {
      title: Lang.t('import.template', 'Template'),
      id: 'template',
    },
  ])

  let view = $derived(views.find((v) => v.id == stepId))

  function setFieldMap(name: string, index) {
    activeImporter.config.fieldMap[name] = activeMapIndex
    refresh()
  }

  const dateFormats = getDateFormats()

  const fieldMapButtons = [
    {
      title: Lang.t('import.end-time', 'End Time*'),
      required: true,
      id: 'end',
      click() {
        setFieldMap('end', activeMapIndex)
      },
    },
    {
      title: Lang.t('import.start-time', 'Start Time'),
      id: 'start',
      click() {
        setFieldMap('start', activeMapIndex)
      },
    },
    {
      title: Lang.t('import.latitude', 'Latitude'),
      id: 'lat',
      click() {
        setFieldMap('lat', activeMapIndex)
      },
    },
    {
      title: Lang.t('import.longitude', 'Longitude'),
      id: 'lng',
      click() {
        setFieldMap('lng', activeMapIndex)
      },
    },
    {
      title: Lang.t('import.location-name', 'Location Name'),
      id: 'location',
      click() {
        setFieldMap('location', activeMapIndex)
      },
    },
    {
      title: Lang.t('import.source', 'Source'),
      id: 'source',
      click() {
        setFieldMap('source', activeMapIndex)
      },
    },
  ]

  function mapField(fieldIndex) {
    activeMapIndex = fieldIndex
    Interact.popmenu({
      title: `Map ${activeImporter ? activeImporter.getHeaders()[fieldIndex] : Lang.t('import.unknown', 'Unknown')}`,
      buttons: fieldMapButtons,
      id: 'field-map',
    })
  }

  function refresh() {
    refreshing = true
    wait(100, () => {
      refreshing = false
    })
  }

  function getIndexMap(index) {
    let response = null
    if (activeImporter && activeImporter.config && activeImporter.config.fieldMap) {
      response = Object.keys(activeImporter.config.fieldMap).find((key) => {
        return activeImporter.config.fieldMap[key] == index
      })
    }
    return response
  }

  async function startImport() {
    let confirmed = await Interact.confirm(
      `Warning`,
      `This will add ${activeImporter.length()} new records to your data. Be 100% sure everything is accurate.
      If you're unsure, launch Nomie in a private browswer and test on a local only account. Also, backup if you haven't for a while.`
    )
    if (confirmed) {
      if (activeImporter.length() > 1000) {
        Interact.blocker(`Importer starting. With this many records it might freeze the UI, just give it time...`)
      } else {
        Interact.blocker(`Importer starting up...`)
      }

      let importer = new ImportLoader()
      await importer.logs(activeImporter.toLogs()).importLogs((status: any) => {
        Interact.blocker(status.message)
      })

      Interact.stopBlocker()
      showToast({ message: Lang.t('import.import-complete', 'Import complete') })
    }
  }

  function back() {
    if (view && view.id == 'note') {
      stepId = 'home'
    } else if (view && view.id == 'template') {
      activeImporter = undefined
      previewIndex = undefined
      stepId = 'home'
    } else {
      navigate('/settings')
    }
  }

  async function addToImporter(evt) {
    let file = evt.detail
    if (file.data) {
      activeImporter = activeImporter || new CSVRImport({})
      activeImporter.csv(file.data)
      activeImporter.setName(file.file.name)
    }
    return true
  }

  async function insertField() {
    let selectedField: any = await _selectField(`Select a field to Insert into the note`)
    if (selectedField) {
      activeImporter.config.template = `${activeImporter.config.template || ''}{f${selectedField.index}}`.trim()
    }
  }

  function _selectField(title: string) {
    return new Promise((resolve, reject) => {
      let buttons = activeImporter.getHeaders().map((header, index) => {
        return {
          title: `${header}`,
          description: `f${index}: ${truncateText(previewRow[index], 60)}`,
          click() {
            resolve({ header, index })
          },
        }
      })
      Interact.popmenu({
        id: 'field-map-menu',
        title: title,
        description: `Which field maps to ${title}?`,
        buttons,
      })
    })
  }

  async function selectField(logField: any) {
    let selectedField: any = await _selectField(`${logField.title}`)
    if (is.truthy(selectedField)) {
      activeImporter.config.fieldMap[logField.id] = selectedField.index
    }
  }

  async function openTemplate(config: IImportConfig) {
    activeImporter = new CSVRImport(config)
    stepId = 'template'
  }

  async function edit() {
    stepId = 'note'
  }

  async function remove(config: IImportConfig) {
    let confirmed = await Interact.confirm(
      `Remove ${config.name} Importer?`,
      Lang.t('import.you-can-always-remake-it', 'You can always remake it')
    )
    if (confirmed) {
      try {
        // iOS look (Ronald mandate, Phase 7): the importer is removed from the store, so the list updates
        await CsvTemplateStore.remove(config)
        showToast({ message: Lang.t('import.removed', 'Removed') })
      } catch (e) {
        Interact.error(e.message)
      }
    }
  }

  async function save() {
    try {
      // let found = null
      // templates = templates.map((template: IImportConfig) => {
      //   let isMatch = template.id == activeImporter.config.id
      //   if (isMatch) {
      //     found = true
      //   }
      //   return isMatch ? activeImporter.config : template
      // })
      // if (!found) {
      //   templates.push(activeImporter.config)
      // }
      await CsvTemplateStore.upsert(activeImporter.config)
      showToast({ message: Lang.t('import.template-saved', 'Import template saved') })
    } catch (e) {
      Interact.error(e.message)
    }

    return templates
  }

  async function main() {
    await CsvTemplateStore.init()
  }
  onMount(main)
</script>

<BackdropModal className="import" showCapture={false}>
  <ToolbarGrid slot="header">
    <Button
      primary
      slot="left"
      className="text-ios-tint"
      on:click={() => {
        closeModal(id)
      }}>{Lang.t('import.cancel', 'Cancel')}</Button
    >
    <div class="ntitle main">{Lang.t('import.import-csv', 'Import CSV')}</div>
    <div slot="right">
      {#if view && view.id == 'note'}
        <!-- <Button color="clear" on:click={save}>Save</Button> -->
      {:else if view && view.id == 'template'}
        <Button color="clear" on:click={edit}>{Lang.t('import.edit', 'Edit')}</Button>
      {/if}
    </div>
  </ToolbarGrid>

  <main class="page page-csv-import flex-column">
    {#if activeImporter && activeImporter.name}
      <ListItem bg="light" mainClass="py-4">
        <Text size="sm" bold>{truncateText(activeImporter.name, 26, 5)}</Text>
        <Text faded size="sm">
          {Lang.t('import.records-columns', {
            records: activeImporter.length(),
            columns: activeImporter.parsed.data[0].length,
          })}
        </Text>
      </ListItem>
    {/if}
    {#if view && view.id == 'home'}
      <div class=" p-0 import-csv-home">
        <ListItem bg="transparent">
          <span class="text-ios-label2 text-sm leading-tight"
            >{Lang.t(
              'import.select-any-csv-to-begin-you-can-then-map-the-app',
              'Select any CSV to begin. You can then map the appropriate fields to turn a row of data into a Note within Nomie.'
            )}</span
          >
        </ListItem>

        <ListItem>
          <FileUploader
            accept="csv"
            placeholder={Lang.t('import.csv-file', 'CSV File')}
            on:file={async (evt) => {
              await addToImporter(evt)
              stepId = 'note'
            }}
          />
        </ListItem>

        {#if $CsvTemplateStore.length}
          <hr class="divider center my-2" />
          <ListItem itemDivider compact className="bg-transparent">
            {Lang.t('csv-import.saved-templates', 'Saved Templates')}
            <div slot="right">
              {#if listMode != 'edit'}
                <Button
                  color="transparent"
                  size="sm"
                  on:click={() => {
                    listMode = 'edit'
                  }}
                >
                  {Lang.t('general.edit', 'Edit')}
                </Button>
              {:else}
                <Button
                  size="sm"
                  color="transparent"
                  className="text-ios-tint"
                  on:click={() => {
                    listMode = 'list'
                  }}
                >
                  {Lang.t('general.done', 'Done')}
                </Button>
              {/if}
            </div>
          </ListItem>

          {#each $CsvTemplateStore as template}
            <ListItem
              detail
              clickable={listMode == 'list'}
              on:click={() => {
                if (listMode == 'list') {
                  openTemplate(template)
                }
              }}
            >
              <Text bold>{template.name}</Text>
              <Text size="sm" faded>
                {template.template}{Object.keys(template.fieldMap)}
              </Text>
              <div slot="right">
                {#if listMode == 'edit'}
                  <Button
                    size="sm"
                    color="danger"
                    on:click={(evt) => {
                      remove(template)
                    }}
                  >
                    {Lang.t('import.delete', 'Delete')}
                  </Button>
                {/if}
              </div>
            </ListItem>
          {/each}
        {/if}

        <hr class="divider center my-3" />
      </div>
    {:else if view && view.id == 'note' && activeImporter}
      <div class=" p-0 import-csv-note">
        <!-- <ListItem>
          <Input type="text" bind:value={activeImporter.config.name} placeholder="Importer Name" />
        </ListItem> -->
        <ListItem>
          <span>{Lang.t('import.does-this-have-a-header-row', 'Does this have a header row?')}</span>
          <div slot="right">
            <ToggleSwitch
              title={Lang.t('import.header-row', 'Header Row')}
              bind:value={activeImporter.config.hasHeaders}
            />
          </div>
        </ListItem>

        {#if !activeImporter.parsed}
          <FileUploader
            accept="csv"
            label={Lang.t('csv-import.select-csv-file', 'Select CSV File...')}
            on:file={async (evt) => {
              await addToImporter(evt)
            }}
          />
        {:else}
          <div class="px-4 pt-4">
            <div class="text-ios-label opacity-60 text-sm">
              {Lang.t('csv-import.map-fields', 'Map Fields')}
            </div>
          </div>

          {#each fieldMapButtons as logField}
            <ListItem
              bottomLine={16}
              clickable
              title={`${logField.title}`}
              on:click={() => {
                selectField(logField)
              }}
            >
              {#if is.truthy(activeImporter.config.fieldMap[logField.id])}
                {#if logField.id == 'end' || logField.id == 'start'}
                  <Text size="sm" bold>
                    {Lang.t('import.parsed', {
                      date: dayjs(previewRow[activeImporter.config.fieldMap[logField.id]]).format(
                        `${dateFormats.date} ${dateFormats.time}`
                      ),
                    })}
                  </Text>
                {/if}
                <Text size="sm" faded>
                  {previewRow[activeImporter.config.fieldMap[logField.id]]}
                </Text>
              {/if}
              <div slot="right">
                <Button color="transparent" className="text-ios-tint">
                  {#if is.truthy(activeImporter.config.fieldMap[logField.id])}
                    f{activeImporter.config.fieldMap[logField.id]}
                  {:else}<span class="text-sm font-bold">{Lang.t('import.map', 'Map')}</span>{/if}
                  <IonIcon icon={ChevronDownOutline} size={14} className="text-ios-tint ml-2 -mr-2" />
                </Button>
              </div>
            </ListItem>
          {/each}
          <ListItem>
            <div class="text-ios-label">{Lang.t('import.note-2', 'Note*')}</div>
            <Input
              type="textarea"
              placeholder={Lang.t('csv-import.compose-note', 'Compose a note for this CSV data')}
              rows={3}
              bind:value={activeImporter.config.template}
            >
              <div slot="right">
                <Button shape="round" color="transparent" on:click={insertField}>
                  <IonIcon icon={AddCircleOutline} />
                </Button>
              </div>
            </Input>
          </ListItem>
          {#if expandFields}
            {#each activeImporter.getHeaders() as header, index}
              <ListItem compact className="py-1">
                <div slot="left">
                  <Text size="xs" bold>f{index}</Text>
                </div>
                <Text size="sm">{header}</Text>
                {#if previewRow}
                  <Text size="xs">{truncateText(previewRow[index], 26)}</Text>
                {/if}
                <div slot="right">
                  {#if !refreshing}
                    {#if getIndexMap(index)}
                      {getIndexMap(index)}
                    {:else}
                      <Button
                        color="clear"
                        className="text-ios-tint"
                        on:click={() => {
                          mapField(index)
                        }}
                      >
                        {Lang.t('import.assign', 'Assign')}
                        <IonIcon icon={ChevronDownOutline} className="text-ios-tint" size={14} />
                      </Button>
                    {/if}
                  {/if}
                </div>
              </ListItem>
            {/each}
          {/if}
        {/if}
      </div>
    {:else if view && view.id == 'template' && activeImporter}
      <div class="">
        <ListItem className="pb-0">
          {Lang.t('import.importer-name', { name: activeImporter.config.name })}
        </ListItem>
        <ListItem>
          <Input
            type="textarea"
            placeholder={Lang.t('csv-import.compose-note')}
            rows={3}
            bind:value={activeImporter.config.template}
          />
        </ListItem>
        {#if !activeImporter.parsed}
          <ListItem bg="transparent">
            <Text size="sm" faded>{Lang.t('import.select-the-csv-to-process', 'Select the CSV to process')}</Text>
            <FileUploader
              accept="csv"
              label={Lang.t('import.csv-file', 'CSV File')}
              on:file={async (evt) => {
                await addToImporter(evt)
              }}
            />
          </ListItem>
        {/if}
      </div>
    {/if}
    {#if previewLog && is.truthy(previewIndex) && activeImporter.parsed}
      {#if previewLog.note && previewLog.note !== 'null'}
        <Divider />
        <div class="examples bg-inverse-2 p-2 px-4">
          <div class="n-toolbar flex pl-2">
            <div class="main text-ios-label text-sm">
              {Lang.t('import.preview-of', { index: previewIndex, total: activeImporter.length() })}
            </div>
            <div class="filler" />
            <NextPrevCal hideCal={true} on:next={nextPreview} on:previous={previousPreview} />
          </div>
          <ListItemLog log={previewLog} />
        </div>
        <ListItem>
          <Button primary block on:click={startImport}>
            {Lang.t('import.import-logs', { num: activeImporter.length() })}
          </Button>
        </ListItem>
      {/if}
    {/if}
  </main>
</BackdropModal>
