<svelte:options runes={true} />

<script lang="ts">
  import ListItem from '../../components/list-item/list-item.svelte'
  import List from '../../components/list/list.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { AddSquareOutline, ShareOutline } from '../../components/icon/nicons'
  import Container from '../../components/container/container.svelte'
  import { Lang } from '../../store/lang'
</script>

<Container className="filler  flex items-center justify-center  flex-col px-2 slide-location -mt-14">
  <p class="px-10 mb-10 text-center text-xl leading-tight text-ios-label font-bold">
    {Lang.t(
      'setup.wait-for-the-best-experience-install-me-on-your-',
      '🔥 WAIT! For the best experience, install me on your iOS homescreen! 📲'
    )}
  </p>

  <div class="px-2">
    <List solo>
      <ListItem bottomLine={48}>
        <span slot="left" class="text-lg font-extrabold"> 1. </span>
        {Lang.t('setup.tap-safari-s-share-icon', "Tap Safari's Share Icon")}
        <IonIcon slot="right" icon={ShareOutline} className="text-ios-label2" />
      </ListItem>
      <ListItem bottomLine={48}>
        <span slot="left" class="text-lg font-extrabold"> 2. </span>
        {Lang.t('setup.scroll-to-select', 'Scroll to & select')}
        <strong>{Lang.t('setup.add-to-home-screen', '"Add to Home Screen"')}</strong>
        <IonIcon slot="right" icon={AddSquareOutline} className="text-ios-label2" />
      </ListItem>
      <ListItem>
        <span slot="left" class="text-lg font-extrabold"> 3. </span>
        {Lang.t(
          'setup.when-added-go-to-your-home-screen-and-launch-dai',
          'When added, go to your Home Screen and launch Daily Nomie'
        )}
      </ListItem>
    </List>
  </div>
</Container>
