<script>
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { Address } from "web3x-es/address";
  import Button from "./components/Button.svelte";
  import Steps from "./components/Steps.svelte";
  import Input from "./components/Input.svelte";
  import BancorConversionWidget from "bancor-conversion-widget";
  import * as ethStore from "./stores/eth.js";
  import * as appStore from "./stores/app.js";
  import * as stepsStore from "./stores/steps.js";
  import colors from "./utils/colors";

  let tokenAddress;
  let enterAddress;
  let steps;
  let trade;

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
    background: #f1f1f1;
  }

  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 80vw;
    text-align: center;
    padding: 50px;
  }

  .content-styled {
    background: #ffffff;
    border-radius: 5px;
    border: 1px solid grey;
  }

  .button {
    margin-top: 20px;
  }

  .exchange {
    width: 50vw;
  }
</style>

<!-- widget is build by me on a different repository -->

<div class="container">
  <div class={`content ${!trade ? 'content-styled' : ''}`}>
    {#if trade}
      <div class="exchange">
        <BancorConversionWidget
          orientation="horizontal"
          theme="light"
          colors={{}}
          tokenA="ETH"
          tokenB="BNT" />
      </div>
      <Button
        on:click={() => (trade = false)}
        bgColor={colors.buttonBg}
        fontColor={colors.buttonFont}
        borderColor={colors.buttonBorder}>
        go back
      </Button>
    {:else if !enterAddress}
      <span style="line-height: 27px;">
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
        or
        <Button
          on:click={() => (trade = true)}
          bgColor={colors.buttonBg}
          fontColor={colors.buttonFont}
          borderColor={colors.buttonBorder}>
          trade
        </Button>
      </div>
    {:else if !steps}
      <h4 style="margin-bottom: 10px;">Enter your token's address</h4>
      {' '}
      <Input
        on:change={e => {
          tokenAddress = e.target.value;
        }}
        type="text"
        placeholder="0x..."
        bgColor={colors.inputBg}
        fontColor={colors.inputFont}
        borderColor={colors.inputBorder} />
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
