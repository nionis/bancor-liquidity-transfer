<script>
  import { get } from "svelte/store";
  import useCssVars from "svelte-css-vars";
  import { toWei } from "web3x-es/utils";
  import MdCheck from "svelte-icons/md/MdCheck.svelte";
  import Button from "./Button.svelte";
  import Loading from "./Loading.svelte";
  import NumberInput from "./NumberInput.svelte";
  import Icon from "./Icon.svelte";
  import { nextStep } from "../stores/steps";
  import Required from "../utils/Required";
  import colors, { Opacity } from "../utils/colors";

  export let store = Required("store");
  export let index = Required("index");
  export let activeIndex = Required("activeIndex");

  $: number = index + 1;
  $: active = index === $activeIndex;
  $: disabled = !active;
  $: done = $activeIndex > index;

  $: cssVars = {
    containerBg: colors.containerBg,
    containerFont: colors.containerFont,
    containerBorder: colors.containerBorder,
    opacity: Opacity({ disabled })
  };

  let value = 0;
</script>

<style>
  .container {
    display: flex;
    justify-content: center;
    height: 70px;
    width: 100%;
    margin: 10px;
    border-radius: 10px;
    color: var(--containerFont);
    border: var(--containerBorder) 1px solid;
    background-color: var(--containerBg);
    opacity: var(--opacity);
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  .text {
    display: flex;
    justify-content: flex-start;
  }

  .status {
    display: flex;
    justify-content: flex-end;
    flex: 2;
  }

  .input {
    width: 100px;
  }
</style>

<div class="container" use:useCssVars={cssVars}>
  <div class="item number">{number}</div>
  <div class="item text">{$store.text}</div>
  <div class="item status">
    {#if !done}
      <div class="item input">
        {#if $store.inputMsg}
          <NumberInput
            on:change={e => {
              store.update(() => {
                $store.fnOps.input = e.target.value;
                return $store;
              });
            }}
            {disabled}
            placeholder={$store.inputMsg}
            bgColor={colors.inputBg}
            fontColor={colors.inputFont}
            borderColor={colors.inputBorder}
            max="1000000" />
        {/if}

      </div>
      <div class="item">
        <Button
          on:click={nextStep}
          {disabled}
          bgColor={colors.buttonBg}
          fontColor={colors.buttonFont}
          borderColor={colors.buttonBorder}>
          SKIP
        </Button>
        <Button
          on:click={$store.fn}
          {disabled}
          loading={$store.pending}
          bgColor={colors.buttonBg}
          fontColor={colors.buttonFont}
          borderColor={colors.buttonBorder}>
          GO
        </Button>
      </div>
    {:else}
      <Icon orientation="horizontal" color={colors.containerFont}>
        <MdCheck />
      </Icon>
    {/if}
  </div>
</div>
