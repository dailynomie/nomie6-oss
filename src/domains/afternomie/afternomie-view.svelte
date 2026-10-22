<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'
  import List from '../../components/list/list.svelte'
  import Empty from '../../components/empty/empty.svelte'
  import { QRCode } from '../../components/icon/nicons'
  import { PaperPlaneSolid } from '../../components/icon/nicons'
  import Button from '../../components/button/button.svelte'
  import DatePicker from '../../components/date-picker/date-picker.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import ToggleSwitch from '../../components/toggle-switch/toggle-switch.svelte'
  import Input from '../../components/input/input.svelte'
  import Divider from '../../components/divider/divider.svelte'
  import { openPopMenu, type PopMenuButton } from '../../components/pop-menu/usePopmenu'
  import Storage from '../../domains/storage/storage'
  import { encryptObject } from '../../utils/encrypt/encrypt'
  import { QRCodeImage } from 'svelte-qrcode-image'
  import { Lang } from '../../store/lang'

  let view = $state('step1')
  let retrycreateqr = $state(false)
  let refreshqr = $state(false)
  let qrwidth = $state(0)
  let innerWidth = $state(0)
  let lockwidth = $state(false)
  let pouchEngine = $state(undefined)
  let stored = $state(false)
  let enckey = $state('Dummy')
  let txt = $state('')
  let domain = $state('www.afternomie.com')

  //message variables
  let subject = $state('')
  let subject_valid = $state(false)
  let subject_style = $state('')
  let message = $state('')
  let message_valid = $state(false)
  let message_style = $state('')
  let primaryemail = $state('')
  let primary_valid = $state(false)
  let primary_style = $state('')
  let secondaryemail = $state('')
  let secondary_valid = $state(false)
  let secondary_style = $state('')
  let waitingtime = $state(0)
  let expiration = $state(false)
  let expirationdate = $state(new Date())
  let nomie = $state(false)
  let nomiedata = $state({ url: '', db: '', user: '', pw: '' })
  let nomiedata_valid = $state(false)

  $effect(() => {
    if (innerWidth && !lockwidth && !refreshqr) {
      qrwidth = innerWidth * 0.93
      if (qrwidth > 500) {
        qrwidth = 500
      }
      refreshqr = true
      setTimeout(function () {
        refreshqr = false
      }, 10)
    }
  })

  $effect(() => {
    if (nomiedata) {
      if (nomiedata.url.toString() != '') {
        nomiedata_valid = true
      } else {
        nomiedata_valid = false
      }
    }
  })

  $effect(() => {
    if (primaryemail) {
      primary_valid = checkemail(primaryemail)
      if (primary_valid) {
        primary_style = 'background-color:var(--ios-good-soft)'
      } else {
        primary_style = ''
      }
    }
  })

  $effect(() => {
    if (secondaryemail) {
      secondary_valid = checkemail(secondaryemail)
      if (secondary_valid) {
        secondary_style = 'background-color:var(--ios-good-soft)'
      } else {
        secondary_style = ''
      }
    }
  })

  function checkemail(enteredEmail = '') {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(enteredEmail)
  }

  function subjectChange() {
    if (subject.length > 10 && subject.length < 100) {
      subject_valid = true
      subject_style = 'background-color:var(--ios-good-soft)'
    } else {
      subject_valid = false
      subject_style = ''
    }
  }

  function messageChange() {
    if (message.length > 100 && message.length < 1000) {
      message_valid = true
      message_style = 'background-color:var(--ios-good-soft)'
    } else {
      message_valid = false
      message_style = ''
    }
  }

  const selectdays = () => {
    let createlist = [
      {
        title: Lang.t('afternomie.1-day', '1 Day'),
        checked: 1 == waitingtime,
        click() {
          if (waitingtime !== 1) {
            waitingtime = 1
          }
        },
      },
      {
        title: Lang.t('afternomie.2-days', '2 Days'),
        checked: 2 == waitingtime,
        click() {
          if (waitingtime !== 2) {
            waitingtime = 2
          }
        },
      },
      {
        title: Lang.t('afternomie.3-days', '3 Days'),
        checked: 3 == waitingtime,
        click() {
          if (waitingtime !== 3) {
            waitingtime = 3
          }
        },
      },
      {
        title: Lang.t('afternomie.4-days', '4 Days'),
        checked: 4 == waitingtime,
        click() {
          if (waitingtime !== 4) {
            waitingtime = 4
          }
        },
      },
      {
        title: Lang.t('afternomie.5-days', '5 Days'),
        checked: 5 == waitingtime,
        click() {
          if (waitingtime !== 5) {
            waitingtime = 5
          }
        },
      },
      {
        title: Lang.t('afternomie.6-days', '6 Days'),
        checked: 6 == waitingtime,
        click() {
          if (waitingtime !== 6) {
            waitingtime = 6
          }
        },
      },
      {
        title: Lang.t('afternomie.7-days', '7 Days'),
        checked: 7 == waitingtime,
        click() {
          if (waitingtime !== 7) {
            waitingtime = 7
          }
        },
      },
      {
        title: Lang.t('afternomie.10-days', '10 Days'),
        checked: 10 == waitingtime,
        click() {
          if (waitingtime !== 10) {
            waitingtime = 10
          }
        },
      },
      {
        title: Lang.t('afternomie.14-days', '14 Days'),
        checked: 14 == waitingtime,
        click() {
          if (waitingtime !== 14) {
            waitingtime = 14
          }
        },
      },
      {
        title: Lang.t('afternomie.15-days', '15 Days'),
        checked: 15 == waitingtime,
        click() {
          if (waitingtime !== 15) {
            waitingtime = 15
          }
        },
      },
      {
        title: Lang.t('afternomie.20-days', '20 Days'),
        checked: 20 == waitingtime,
        click() {
          if (waitingtime !== 20) {
            waitingtime = 20
          }
        },
      },
      {
        title: Lang.t('afternomie.30-days', '30 Days'),
        checked: 30 == waitingtime,
        click() {
          if (waitingtime !== 30) {
            waitingtime = 30
          }
        },
      },
      {
        title: Lang.t('afternomie.60-days', '60 Days'),
        checked: 60 == waitingtime,
        click() {
          if (waitingtime !== 60) {
            waitingtime = 60
          }
        },
      },
      {
        title: Lang.t('afternomie.90-days', '90 Days'),
        checked: 90 == waitingtime,
        click() {
          if (waitingtime !== 90) {
            waitingtime = 90
          }
        },
      },
      {
        title: Lang.t('afternomie.120-days', '120 Days'),
        checked: 120 == waitingtime,
        click() {
          if (waitingtime !== 120) {
            waitingtime = 120
          }
        },
      },
    ]

    const buttons: Array<PopMenuButton> = createlist

    openPopMenu({
      id: 'days-list',
      buttons,
    })
  }

  function GoToStep(step) {
    view = step
  }

  function CreateQR() {
    if (retrycreateqr == true) {
      view = 'WaitingRespone'
      setTimeout(() => {
        encryptobject()
      }, 1500)
    } else {
      encryptobject()
    }
  }

  function changeDate() {
    //placeholder
  }

  async function encryptobject() {
    if (stored == false) {
      var uniqueid = key(15)

      var data = {
        subject: subject,
        note: message,
        email_primary: primaryemail,
        email_secondary: secondaryemail,
        inactivity: waitingtime,
        exp_checked: expiration,
        exp_date: expirationdate,
        uniqueid: uniqueid,
        nomiedata: nomie,
      }

      enckey = key(15)
      var encryptednote = encryptObject(data, enckey)
      txt = domain + '/view/' + encryptednote
      if (txt.includes('localhost') || txt.includes('192.168.178')) {
        txt = 'http://' + txt
      } else {
        txt = 'https://' + txt
      }
      var result = await saveLog(uniqueid)
      if (result.ok) {
        stored = true
        view = 'step4'
      } else {
        view = 'oops'
      }
    }
  }

  function key(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    var charLength = chars.length
    var result = ''
    for (var i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * charLength))
    }
    return result
  }

  const saveLog = async (uniqueid) => {
    var lastrequest = new Date().getTime()
    var lastvalidated = new Date().getTime()
    try {
      const response = await fetch('https://' + domain + '/start/addLog', {
        method: 'POST',
        body: JSON.stringify({
          uniqueid: uniqueid,
          lastrequest: lastrequest,
          lastreset: lastvalidated,
          expiredate: new Date(expirationdate).getTime(),
          expires: expiration,
        }),
        headers: {
          'content-type': 'application/json',
        },
      })
      return response
    } catch {
      return { ok: false }
    }
  }

  function printscreen() {
    lockwidth = true
    qrwidth = 500
    refreshqr = true
    setTimeout(function () {
      refreshqr = false
    }, 1)

    setTimeout(function () {
      //temp
      try {
        if (!document.execCommand('print', false, null)) {
          window.print()
        }
      } catch {
        window.print()
      }
      //tempend

      //window.print()
    }, 100)

    setTimeout(function () {
      lockwidth = false
    }, 3000)
  }

  function startNew() {
    retrycreateqr = false
    refreshqr = false
    lockwidth = false
    stored = false
    enckey = 'Dummy'
    txt = ''
    domain = 'www.afternomie.com'

    //message iables
    subject = ''
    subject_valid = false
    subject_style = ''
    message = ''
    message_valid = false
    message_style = ''
    primaryemail = ''
    primary_valid = false
    primary_style = ''
    secondaryemail = ''
    secondary_valid = false
    secondary_style = ''
    waitingtime = 0
    expiration = false
    expirationdate = new Date()
    nomie = false
    nomiedata = { url: '', db: '', user: '', pw: '' }
    nomiedata_valid = false
    view = 'step1'
  }

  onMount(async () => {
    // Get Pouch ENgine
    pouchEngine = Storage.getEngine()
    // Get Remote Settings
    //@ts-ignore
    var remote
    try {
      remote = pouchEngine.getRemote()
      nomiedata = { url: remote.url.toString(), db: remote.database, user: remote.username, pw: remote.password }
    } catch {
      //placeholder
      nomiedata = { url: '', db: '', user: '', pw: '' }
    }
  })
</script>

<svelte:window bind:innerWidth />

{#if view == 'step1'}
  <List transparent className="max-w-md mx-auto">
    <Empty icon={QRCode} title={Lang.t('afternomie.afternomie', 'AfterNomie')}>
      <div class="my-0 text-center text-sm font-normal leading-tight text-ios-label">
        {Lang.t(
          'afternomie.afternomie-is-an-opensource-tool-for-creating-em',
          'AfterNomie is an opensource tool for creating emergency notes that can be read by your trusted contacts only after your death or if you are seriously injured.'
        )}
      </div>
      <div class="my-2 text-center text-xs font-normal leading-tight text-ios-label">
        {Lang.t(
          'afternomie.directly-after-you-created-your-note-it-will-be-',
          'Directly after you created your note, it will be encrypted and converted into a QR code which you can give to a person you trust. When this person tries to access your message, AfterNomie will try to contact you via email as soon as possible; if you do not reply within the period of time you previously defined, your note will become visible to your trusted person. When you use AfterNomie in combination with DailyNomie & Sync Service it will enable you to reveal your Nomie tracking history in conjunction with your note.'
        )}
      </div>
      <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
        {Lang.t('afternomie.more-information-can-be-found-at', 'More information can be found at')}
        <a class="text-ios-tint" target="_blank" href="https://www.dailynomie.com/?s=afternomie"
          >{Lang.t('afternomie.dailynomie-afternomie', 'DailyNomie-AfterNomie')}</a
        >
      </div>
      <Button className="mt-2" clear primary on:click={() => GoToStep('step2')}
        >{Lang.t('afternomie.create-message', 'Create Message →')}</Button
      >
    </Empty>
  </List>
{/if}
{#if view == 'step2'}
  <List solo className="max-w-md mx-auto">
    <Input
      type="text"
      bind:value={subject}
      listItem
      label={Lang.t('afternomie.subject-between-10-and-100-characters', 'Subject (between 10 and 100 characters)')}
      placeholder={Lang.t(
        'afternomie.subject-between-10-and-100-characters',
        'Subject (between 10 and 100 characters)'
      )}
      style={subject_style}
      on:input={() => {
        subjectChange()
      }}
    ></Input>
    <Divider left={16} />
    <Input
      type="textarea"
      rows={4}
      bind:value={message}
      listItem
      label={Lang.t('afternomie.message-between-100-and-1000-characters', 'Message (between 100 and 1000 characters)')}
      placeholder={Lang.t(
        'afternomie.message-between-100-and-1000-characters',
        'Message (between 100 and 1000 characters)'
      )}
      style={message_style}
      on:input={() => {
        messageChange()
      }}
    ></Input>
    <Divider left={16} />
    <Input
      type="text"
      bind:value={primaryemail}
      listItem
      label={Lang.t('afternomie.primary-email-address-mandatory', 'Primary Email Address (mandatory)')}
      placeholder={Lang.t('afternomie.primary-email-address-mandatory', 'Primary Email Address (mandatory)')}
      style={primary_style}
    ></Input>
    <Divider left={16} />
    <Input
      type="text"
      bind:value={secondaryemail}
      listItem
      label={Lang.t('afternomie.secondary-email-address-optional', 'Secondary Email Address (optional)')}
      placeholder={Lang.t('afternomie.secondary-email-address-optional', 'Secondary Email Address (optional)')}
      style={secondary_style}
    ></Input>
    <Divider left={16} />
    <ListItem clickable on:click={selectdays}>
      <div class="py-2">{Lang.t('afternomie.how-many-days-waitingtime', 'How Many Days Waitingtime?')}</div>
      <div slot="right">
        {#if waitingtime}
          <span class="text-ios-tint">{waitingtime}</span>
        {:else}
          <span class="text-ios-tint">{Lang.t('afternomie.select', 'Select')}</span>
        {/if}
      </div>
    </ListItem>
    <Divider left={16} />
    <ListItem>
      <div class="py-2">{Lang.t('afternomie.enable-expiration', 'Enable Expiration?')}</div>
      <div slot="right">
        <ToggleSwitch bind:value={expiration} title={Lang.t('afternomie.toggle-expiration', 'Toggle Expiration')} />
      </div>
    </ListItem>
    <Divider left={16} />
    <ListItem disabled={!expiration} bottomLine={52} title={'Expiration Date:'}>
      <div slot="right">
        {#if !expiration}
          <DatePicker
            style="pointer-events:none"
            size="sm"
            on:change={(evt) => {
              changeDate()
            }}
            bind:time={expirationdate}
            bind:date={expirationdate}
          />
        {:else}
          <DatePicker
            size="sm"
            on:change={(evt) => {
              changeDate()
            }}
            bind:time={expirationdate}
            bind:date={expirationdate}
          />
        {/if}
      </div>
    </ListItem>

    <Divider left={16} />
    <ListItem>
      <div class="py-2">{Lang.t('afternomie.include-nomie-data', 'Include Nomie Data?')}</div>
      <div slot="right">
        {#if nomiedata_valid}
          <ToggleSwitch bind:value={nomie} title={Lang.t('afternomie.toggle-nomie-data', 'Toggle Nomie Data')} />
        {/if}
        {#if !nomiedata_valid}
          <ToggleSwitch
            locked={nomiedata_valid}
            bind:value={nomie}
            title={Lang.t('afternomie.toggle-nomie-data', 'Toggle Nomie Data')}
          />
        {/if}
      </div>
    </ListItem>
    <Divider left={16} />
    <ListItem>
      <div slot="right">
        <Button
          disabled={!subject_valid || !message_valid || !primary_valid}
          className="mt-2"
          clear
          primary
          on:click={() => GoToStep('step3')}>{Lang.t('afternomie.summary-2', 'Summary →')}</Button
        >
      </div>
    </ListItem>
  </List>
{/if}
{#if view == 'step3'}
  <List transparent className="max-w-md mx-auto">
    <Empty title={Lang.t('afternomie.summary', 'Summary')}>
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
        <p><b>{Lang.t('afternomie.subject', 'Subject:')}</b></p>
      </div>
      <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
        {subject}
      </div>
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
        <p><b>{Lang.t('afternomie.message-2', 'Message:')}</b></p>
      </div>
      <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
        {message}
      </div>
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
        <p><b>{Lang.t('afternomie.primairy-email', 'Primairy Email:')}</b></p>
      </div>
      <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
        {primaryemail}
      </div>
      {#if secondaryemail != ''}
        <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
          <p><b>{Lang.t('afternomie.secondary-email', 'Secondary Email:')}</b></p>
        </div>
        <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
          {secondaryemail}
        </div>
      {/if}
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
        <p><b>{Lang.t('afternomie.waiting-time', 'Waiting Time:')}</b></p>
      </div>
      {#if waitingtime != 1}
        <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
          {Lang.t('afternomie.waiting-days', { num: waitingtime })}
        </div>
      {:else}
        <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
          {Lang.t('afternomie.waiting-day', { num: waitingtime })}
        </div>
      {/if}
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
        <p><b>{Lang.t('afternomie.set-expiration-date', 'Set Expiration Date:')}</b></p>
      </div>
      {#if expiration}
        <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
          {new Date(expirationdate).toLocaleDateString('en-us', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      {:else}
        <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
          {Lang.t('afternomie.never-expiring-message', 'Never Expiring Message')}
        </div>
      {/if}
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
        <p><b>{Lang.t('afternomie.include-nomie-data-2', 'Include Nomie Data:')}</b></p>
      </div>
      <div class="my-0 text-center text-xs font-normal leading-tight text-ios-label">
        {#if nomie}
          {Lang.t('afternomie.included', 'Included')}
        {:else}
          {Lang.t('afternomie.not-included', 'Not Included')}
        {/if}
      </div>
      <div class="row" style="width:350px">
        <div class="column" style="display:flex;justify-content:left">
          <Button className="mt-2" clear primary on:click={() => GoToStep('step2')}
            >{Lang.t('afternomie.back-2', '← Back')}</Button
          >
        </div>
        <div class="column" style="display:flex;justify-content:right">
          <Button
            className="mt-2"
            clear
            primary
            on:click={() => {
              retrycreateqr = false
              CreateQR()
            }}>{Lang.t('afternomie.submit', 'Submit →')}</Button
          >
        </div>
      </div>
    </Empty>
  </List>
{/if}
{#if view == 'oops'}
  <List transparent className="max-w-md mx-auto">
    <Empty icon={QRCode} title={Lang.t('afternomie.oops', 'Oops')}>
      <div class="my-0 text-center text-sm font-normal leading-tight text-ios-label">
        {Lang.t(
          'afternomie.something-went-wrong-while-creating-your-qr-code',
          'Something went wrong while creating your QR code. Most likely the connection with the backend Log server failed. Please try again. If the issue persists, please go back to your message so you can saveguard your message and try again at a later moment.'
        )}
      </div>
      <div class="row" style="width:350px">
        <div class="column" style="display:flex;justify-content:left">
          <Button
            className="mt-2"
            clear
            primary
            on:click={() => {
              retrycreateqr = false
              GoToStep('step2')
            }}>{Lang.t('afternomie.back-2', '← Back')}</Button
          >
        </div>
        <div class="column" style="display:flex;justify-content:right">
          <Button
            className="mt-2"
            clear
            primary
            on:click={() => {
              retrycreateqr = true
              CreateQR()
            }}>{Lang.t('afternomie.retry', 'Retry →')}</Button
          >
        </div>
      </div>
    </Empty>
  </List>
{/if}
{#if view == 'WaitingRespone'}
  <List transparent className="max-w-md mx-auto">
    <Empty icon={PaperPlaneSolid} title={Lang.t('afternomie.connecting', 'Connecting')}>
      <div class="my-0 text-center text-sm font-normal leading-tight text-ios-label">
        {Lang.t('afternomie.creating-qr-code', 'Creating QR Code....')}
      </div>
    </Empty>
  </List>
{/if}
{#if view == 'step4'}
  <List transparent className="max-w-md mx-auto">
    <Empty>
      <div class="my-2">
        <img src="/images/logos/DN-logo_grey_beta.svg" class="logo" alt="AfterNomie" />
      </div>
      <div class="my-0 text-center text-sm font-normal leading-tight text-ios-label">
        <div style="text-align:center">
          {#if !refreshqr}
            <QRCodeImage bind:text={txt} scale={8} displayType="canvas" bind:width={qrwidth} />
          {/if}
        </div>
      </div>
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label width:{innerWidth}">
        {Lang.t('afternomie.document-note', { key: enckey })}
      </div>
      <Divider left={16} />
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label not-printable">
        <p>
          <b>{Lang.t('afternomie.very-important', 'Very important!')}</b>
          {Lang.t(
            'afternomie.add-the-email-address-dailynomie-gmail-com-to-yo',
            "Add the email address dailynomie@gmail.com to your email provider's safe senders list to prevent any notification from us regarding the note you just created from mistakenly ending up in spam."
          )}
        </p>
      </div>
      <Divider left={16} />
      {#if nomiedata_valid}
        <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
          {Lang.t(
            'afternomie.be-aware-that-this-qr-code-contains-access-to-th',
            'Be aware that this QR-code contains access to the owners Nomie data. Instructions can be found on'
          )}
          <a class="text-ios-tint" target="_blank" href="https://www.afternomie.com"
            >{Lang.t('afternomie.afternomie', 'AfterNomie')}</a
          >
        </div>
        <Divider left={16} />
      {/if}
      <div class="my-1 text-center text-sm font-normal leading-tight text-ios-label">
        {Lang.t('afternomie.created-on', { date: new Date() })}
      </div>
      <div class="row not-printable" style="width:350px">
        <div class="column" style="display:flex;justify-content:left">
          <Button
            className="mt-2"
            clear
            primary
            on:click={() => {
              startNew()
            }}>{Lang.t('afternomie.new', 'New')}</Button
          >
        </div>
        <div class="column" style="display:flex;justify-content:right">
          <Button
            className="mt-2"
            clear
            primary
            on:click={() => {
              printscreen()
            }}>{Lang.t('afternomie.print', 'Print →')}</Button
          >
        </div>
      </div>
    </Empty>
  </List>
{/if}

<style>
  .row {
    display: flex;
  }

  .column {
    flex: 50%;
  }
  @media print {
    .not-printable {
      display: none;
    }
  }
</style>
