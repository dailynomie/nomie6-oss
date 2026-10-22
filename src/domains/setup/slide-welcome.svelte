<svelte:options runes={true} />

<script lang="ts">
  import Logo from '../../components/logo/logo.svelte'
  import { openPrivacyPolicy, openTermsOfService } from '../../components/markdown-modal/MarkdownModalStore'
  import { Prefs } from '../preferences/Preferences'
  import { Lang } from '../../store/lang'
</script>

<div class="flex flex-col px-6 py-4 min-h-fill justify-center items-center -mt-4">
  <div class="max-w-xl flex items-center justify-center flex-col space-y-4">
    <Logo size={32} />
    {#if !$Prefs.storageType}
      <p class="text-2xl leading-none font-extrabold text-center md:text-3xl text-ios-label">
        {Lang.t('setup.daily-journal-for-short-attention-spans', 'Daily Journal for short attention spans.')}
      </p>
    {:else}
      <p class="text-2xl leading-none font-extrabold text-center md:text-3xl text-ios-label">
        {Lang.t('setup.nomie-has-been-updated', '👋 Nomie has been updated.')}
      </p>
    {/if}
    <div>
      <p style="font-size:0.6rem" class="mt-4 lg:text-sm text-center text-ios-label2">
        {Lang.t(
          'setup.nomie-is-a-super-fast-and-super-private-way-to-j',
          "Nomie is a super fast, and super private way to journal, collect your life's data, and reflect on your life's direction."
        )}
      </p>
      <p style="font-size:0.6rem" class="mt-1 lg:text-sm text-center text-ios-label2">
        {Lang.t('setup.by-continuing-you-agree-to-the', 'By continuing, you agree to the')}
        <button on:click={openPrivacyPolicy} class="inline-flex underline"
          >{Lang.t('setup.privacy-policy', 'Privacy Policy')}</button
        >
        {Lang.t('setup.and', 'and')}
        <button on:click={openTermsOfService} class="inline-flex underline"
          >{Lang.t('setup.terms-of-service', 'Terms of Service')}</button
        >.
      </p>
    </div>
    <!-- <p class="text-center flex items-center justify-center">
    <button class="text-xs bg-ios-tintsoft dark:bg-ios-tintsoft text-ios-tint rounded-sm px-2 py-px" on:click={()=>showHowItWorks()} className="text-solid bg-ios-tint" pad>How it works</button>
  </p> -->
    <!-- <br /><br />Learn more <a
    class=" text-ios-tint "
    href="https://docs.nomie.app"
    target="docs">Docs</a
  >,
  <a
    class=" text-ios-tint "
    href="https://reddit.com/r/nomie"
    target="docs">Reddit</a
  >,
  <a
    class=" text-ios-tint "
    href="https://tiktok.com/@nomieapp"
    target="docs">Tiktok</a
  > -->
  </div>
</div>
