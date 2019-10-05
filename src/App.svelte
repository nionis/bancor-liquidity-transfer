<script>
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { Address } from "web3x-es/address";
  import Button from "./components/Button.svelte";
  import Steps from "./components/Steps.svelte";
  import * as ethStore from "./stores/eth.js";
  import * as appStore from "./stores/app.js";
  import * as stepsStore from "./stores/steps.js";
  import colors from "./utils/colors";

  let tokenAddress;
  let enterAddress;
  let steps;

  $: validTokenAddress = (() => {
    try {
      Address.fromString(tokenAddress);
      return true;
    } catch (err) {
      return false;
    }
  })();
  $: errorMsg = appStore.errorMsg;
  $: disabled = !!$errorMsg || !validTokenAddress;

  onMount(async () => {
    await ethStore.init();
    await appStore.init();
  });
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100vw;
    min-height: 100vh;
    /* background-color: #dce3ff; */
  }

  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 80vw;
  }

  .button {
    margin-top: 20px;
  }

  input {
    width: 350px;
    height: 20px;
    border-radius: 10px;
    margin-top: 10px;
    border: 1px solid black;
  }
</style>

<div class="container">
  <div class="content">
    {#if !enterAddress}
      <span>
        Bancor recently announced the release of USDB - a stable version of
        Bancor’s Network Token, BNT.
        <br />
        USDB-based relays allow liquidity providers to plug into Bancor and
        generate fees from conversions without exposure to two volatile assets -
        which could dramatically reduce the risk of impermanent loss.
        <br />
        This DAPP allows liquidity providers to transfer their liquidity from an
        existing Bancor liquidity pool (using BNT) to a Bancor liquidity pool
        that utilizes USDB.
      </span>
      <div class="button">
        <Button
          on:click={() => (enterAddress = true)}
          bgColor={colors.buttonBg}
          fontColor={colors.buttonFont}
          borderColor={colors.buttonBorder}>
          start
        </Button>
      </div>
    {:else if !steps}
      <h4>Enter your token's address</h4>
      {' '}
      <input type="text" bind:value={tokenAddress} />
      <div class="button">
        <Button
          on:click={() => {
            appStore.initXToken(tokenAddress);
            steps = true;
          }}
          {disabled}
          bgColor={colors.buttonBg}
          fontColor={colors.buttonFont}
          borderColor={colors.buttonBorder}>
          next
        </Button>
      </div>
      {#if $errorMsg}
        <p>{$errorMsg}</p>
      {/if}
    {:else}
      <Steps />
    {/if}
  </div>
</div>
