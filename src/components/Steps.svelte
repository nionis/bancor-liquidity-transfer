<script>
  import { get } from "svelte/store";
  import Button from "./Button.svelte";
  import Loading from "./Loading.svelte";
  import Step from "./Step.svelte";
  import * as appStore from "../stores/app.js";
  import * as ethStore from "../stores/eth.js";
  import * as stepsStore from "../stores/steps.js";
  import colors from "../utils/colors";

  $: errorMsg = appStore.errorMsg;
  $: steps = stepsStore.steps;
  $: onStep = stepsStore.onStep;
  $: account = ethStore.account;
  $: xTokenBntConverter = appStore.xTokenBntConverter;
  $: xTokenUsdbConverter = appStore.xTokenUsdbConverter;
  $: xTokenBntConverterConversions = appStore.xTokenBntConverterConversions;
  $: xTokenUsdbConverterConversions = appStore.xTokenUsdbConverterConversions;
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    margin-top: 2vh;
    min-height: 100vh;
  }

  .controlsContainer {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    width: 100%;
    min-height: 7vh;
    text-align: center;
  }

  .stepsContainer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin-top: 1vh;
  }
</style>

<div class="container">
  <div class="controlsContainer">
    {#if typeof $xTokenBntConverter !== 'undefined'}
      <div>
        BNT pool
        <Button
          on:click={() => get(xTokenBntConverter)
              .methods.disableConversions(get(xTokenBntConverterConversions))
              .send({ from: get(ethStore.account) })}
          bgColor={colors.buttonBg}
          fontColor={colors.buttonFont}
          borderColor={colors.buttonBorder}>
          {#if $xTokenBntConverterConversions}DISABLE{:else}ENABLE{/if}
        </Button>
      </div>
    {/if}
    {#if typeof $xTokenUsdbConverter !== 'undefined'}
      <div>
        USDB pool
        <Button
          on:click={() => get(xTokenUsdbConverter)
              .methods.disableConversions(get(xTokenUsdbConverterConversions))
              .send({ from: get(ethStore.account) })}
          bgColor={colors.buttonBg}
          fontColor={colors.buttonFont}
          borderColor={colors.buttonBorder}>
          {#if $xTokenUsdbConverterConversions}DISABLE{:else}ENABLE{/if}
        </Button>
      </div>
    {/if}

  </div>
  {#if $steps.length === 0}
    <Loading color={colors.containerFont} />
  {:else if $errorMsg}
    <p>{$errorMsg}</p>
  {:else}
    <div class="stepsContainer">
      {#each $steps as step, i}
        <Step store={step} index={i} activeIndex={onStep} />
      {/each}
    </div>
  {/if}
</div>
