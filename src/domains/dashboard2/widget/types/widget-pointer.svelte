<script lang="ts">
  import type { TrackableUsage } from '../../../usage/trackable-usage.class'
  import type { WidgetClass } from '../widget-class'
  import { onMount } from 'svelte'

  //export let logs: Array<NLog>
  export let widget: WidgetClass
  export let trackable: Trackable
  export let usage: TrackableUsage

  let amountofsamples = widget.data.pointersamples || 4
  let samples = []
  let tempusage = []
  let barwidth = '10%'

  function createDate(inputdate) {
    let date = inputdate
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let dt = date.getDate()

    if (dt < 10) {
      dt = '0' + dt
    }
    if (month < 10) {
      month = '0' + month
    }
    return year + '-' + month + '-' + dt
  }

  function initWidget() {
    // load the data in initial sample dataset
    for (var i = 0; i < tempusage.length; i++) {
      var temptracker = tempusage[i].trackers.filter(function (el) {
        return el.id == trackable.tracker.tag
      })
      let tempvalue = temptracker[0].value
      let tempdate = tempusage[i].start
      let height = '100%'
      samples.push({ Value: tempvalue, Date: tempdate, Height: height })
    }
    // restrict the amount of samples to the choosen amount
    if (samples.length > amountofsamples) {
      let samplestemp = samples
      samples = []
      for (var i = samplestemp.length - amountofsamples; i < samplestemp.length; i++) {
        samples.push({ Date: samplestemp[i].Date, Value: samplestemp[i].Value, Height: samplestemp[i].Height })
      }
    }
    // first determin highest value
    let maxvalue = Math.max(...samples.map((o) => o.Value))
    // now make sure the height is adjusted to value (between 100% and 0%)
    for (var i = 0; i < samples.length; i++) {
      samples[i].Height = Math.round((samples[i].Value / maxvalue) * 100).toString() + '%'
    }
    // and adjust barwidth accordingly
    barwidth = (Math.round(100 / samples.length) - 2).toString() + '%'
  }

  onMount(() => {
    tempusage = usage.logs.filter(function (el) {
      return el.note?.includes('^' + widget.pointer.id)
    })
    //console.log("FILTER: ",tempusage)
    initWidget()
  })
</script>

<div class="current dark:text-white h-full w-full flex items-center justify-center flex-col">
  {#if samples.length > 0}
    <div class="parent" style="font-size:60%">
      {#each samples as sample, i}
        <span id="third" class="bar" style="height:{sample.Height}; width: {barwidth}"
          ><p class="label">{createDate(sample.Date)} ({sample.Value})</p></span
        >
      {/each}
    </div>
  {/if}
</div>

<style>
  .parent {
    display: flex;
    justify-content: space-between;
    height: 100%;
    width: 95%;
    margin-left: 2%;
    margin-right: 2%;
    margin-top: -2%;
    transform: rotateX(180deg);
    border-top: 1px solid black;
  }

  span.bar {
    height: 100%;
    width: 10%;
    transition: all 0.4s ease-in-out;
    border-radius: 0px 0px 5px 5px;
  }

  .label {
    transform: rotate(90deg) rotateX(180deg);
    margin-top: 115%;
    margin-bottom: 60%;
    width: 230%;
    margin-left: -60%;
  }

  #first {
    background-color: #ed2527;
  }

  #second {
    background-color: #3db549;
  }

  #third {
    background-color: #2289b4;
  }

  #fourth {
    background-color: #f79321;
  }

  #five {
    background-color: #94afdc;
  }

  #six {
    background-color: #ff5f75;
  }

  #seven {
    background-color: #00adef;
  }

  #eight {
    background-color: #935fa7;
  }
</style>
