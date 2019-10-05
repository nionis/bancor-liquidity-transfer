import { writable, get } from "svelte/store";
import { Address } from "web3x-es/address";
import { bufferToHex, utf8ToHex, toWei } from "web3x-es/utils";
import * as ethStore from "./eth";
import * as stepsStore from "./steps";
import Contract, { getBytecode } from "../utils/Contract";
import * as storage from "../utils/storage";
import * as bancorNetworkFns from "../utils/bancorNetwork";
import * as env from "../env";

export const errorMsg = writable(undefined);
export const contractRegistry = writable(undefined);
export const converterRegistry = writable(undefined);
export const bancorNetwork = writable(undefined);
export const bntToken = writable(undefined);
export const usdbToken = writable(undefined);
export const usdbConverter = writable(undefined);
export const xToken = writable(undefined);
export const xTokenBntRelay = writable(undefined);
export const xTokenUsdbRelay = writable(undefined);
export const xTokenBntConverter = writable(undefined);
export const xTokenBntConverterConversions = writable(undefined);
export const xTokenUsdbConverter = writable(undefined);
export const xTokenUsdbConverterConversions = writable(undefined);

export const init = async () => {
  const networkId = get(ethStore.networkId);
  const addresses = env.addresses[networkId];

  // only mainnet or localhost
  if (!addresses) {
    errorMsg.update(() => "Please use mainnet network");
    return;
  }

  const eth = get(ethStore.eth);

  const converterRegistry$ = await Contract(
    eth,
    "BancorConverterRegistry",
    addresses.converterRegistry
  );
  converterRegistry.update(() => converterRegistry$);

  const contractRegistry$ = await Contract(
    eth,
    "ContractRegistry",
    addresses.contractRegistry
  );
  contractRegistry.update(() => contractRegistry$);

  const bntToken$ = await Contract(eth, "SmartToken", addresses.bntToken);
  bntToken.update(() => bntToken$);

  const usdbToken$ = await Contract(eth, "SmartToken", addresses.usdbToken);
  usdbToken.update(() => usdbToken$);

  const tokenConverterCount = await converterRegistry$.methods
    .converterCount(usdbToken$.address)
    .call();

  if (Number(tokenConverterCount) > 0) {
    const tokenConverterAddress = await converterRegistry$.methods
      .converterAddress(
        usdbToken$.address,
        String(Number(tokenConverterCount) - 1)
      )
      .call()
      .then(res => bufferToHex(res.buffer));

    const tokenConverter = await Contract(
      eth,
      "BancorConverter",
      tokenConverterAddress
    );

    usdbConverter.update(() => tokenConverter);
  }

  const bancorNetworkAddress = await contractRegistry$.methods
    .addressOf(utf8ToHex("BancorNetwork"))
    .call()
    .then(res => bufferToHex(res.buffer));

  const bancorNetwork$ = await Contract(
    eth,
    "BancorNetwork",
    bancorNetworkAddress
  );

  bancorNetwork.update(() => bancorNetwork$);
};

// run once user enters token address
export const initXToken = async xTokenAddress => {
  try {
    const eth = get(ethStore.eth);
    const networkId = get(ethStore.networkId);
    const addresses = env.addresses[networkId];

    // only mainnet or localhost
    if (!addresses) {
      errorMsg.update(() => "Please use mainnet network");
      return;
    }

    const xToken$ = await Contract(eth, "SmartToken", xTokenAddress);
    const [xTokenName, xTokenSymbol, xTokenDecimals] = await Promise.all([
      xToken$.methods.name().call(),
      xToken$.methods.symbol().call(),
      xToken$.methods.decimals().call()
    ]);

    if (!xTokenName) {
      errorMsg.update(() => "Token not found");
      return;
    }

    xToken.update(() => xToken$);

    // restore from localStorage
    if (storage.get("xTokenUsdbRelay")) {
      const relay = await Contract(
        eth,
        "SmartToken",
        storage.get("xTokenUsdbRelay")
      );

      xTokenUsdbRelay.update(() => {
        return relay;
      });
    }

    if (storage.get("xTokenUsdbConverter")) {
      const converter = await Contract(
        eth,
        "BancorConverter",
        storage.get("xTokenUsdbConverter")
      );

      xTokenUsdbConverter.update(() => {
        return converter;
      });
    }

    const contractRegistry$ = get(contractRegistry);
    const converterRegistry$ = get(converterRegistry);
    const converterCount = await converterRegistry$.methods
      .converterCount(xToken$.address)
      .call()
      .then(res => Number(res));

    if (converterCount === 0) {
      errorMsg.update(() => "No convertors found");
      return;
    }

    const converters = await Promise.all(
      Array.from(Array(converterCount)).map(async (v, index) => {
        const tokenConverterAddress = await converterRegistry$.methods
          .converterAddress(xToken$.address, String(index))
          .call()
          .then(res => bufferToHex(res.buffer));

        const tokenConverter = await Contract(
          eth,
          "BancorConverter",
          tokenConverterAddress
        );

        const mainConnectorToken = await Contract(
          eth,
          "SmartToken",
          await tokenConverter.methods
            .connectorTokens(0)
            .call()
            .then(res => bufferToHex(res.buffer))
        );

        const relay = await Contract(
          eth,
          "SmartToken",
          await tokenConverter.methods
            .token()
            .call()
            .then(res => bufferToHex(res.buffer))
        );

        return { tokenConverter, mainConnectorToken, relay };
      })
    );

    await Promise.all(
      converters.map(async converter => {
        const { tokenConverter, mainConnectorToken, relay } = converter;

        const isBnt = Address.fromString(mainConnectorToken.address).equals(
          Address.fromString(addresses.bntToken)
        );
        const isUsdb = Address.fromString(mainConnectorToken.address).equals(
          Address.fromString(addresses.usdbToken)
        );

        if (isBnt) {
          xTokenBntRelay.update(() => relay);
          xTokenBntConverter.update(() => tokenConverter);
        } else if (isUsdb) {
          xTokenUsdbRelay.update(() => relay);
          xTokenUsdbConverter.update(() => tokenConverter);
        }
      })
    );

    if (!get(xTokenBntConverter)) {
      errorMsg.update(() => "BNT convertor not found");
      return;
    }

    const account = get(ethStore.account);
    const steps = [];

    if (get(xTokenBntConverter)) {
      const conversions = await get(xTokenBntConverter)
        .methods.conversionsEnabled()
        .call();
      xTokenBntConverterConversions.update(() => conversions);
    }

    if (get(xTokenUsdbConverter)) {
      const conversions = await get(xTokenUsdbConverter)
        .methods.conversionsEnabled()
        .call();
      xTokenUsdbConverterConversions.update(() => conversions);
    }

    // create relay
    if (!get(xTokenUsdbRelay)) {
      steps.push(
        stepsStore.Step({
          text: `Create ${xTokenSymbol}USDB Relay Token.`,
          fn: stepsStore.SyncStep(async () => {
            return Contract(eth, "SmartToken").then(contract => {
              const name = xTokenName + " Smart Relay Token";
              const symbol = xTokenSymbol + "USDB";
              const decimals = xTokenDecimals;

              return contract
                .deployBytecode(
                  getBytecode("SmartToken"),
                  name,
                  symbol,
                  decimals
                )
                .send({
                  from: account
                });
            });
          }),
          async after(receipt) {
            const address = bufferToHex(receipt.contractAddress).substring(2);
            const relay = await Contract(eth, "SmartToken", address);

            xTokenUsdbRelay.update(() => {
              return relay;
            });
            storage.save("xTokenUsdbRelay", address);

            return receipt;
          }
        })
      );
    }

    // create converter
    if (!get(xTokenUsdbConverter)) {
      steps.push(
        stepsStore.Step({
          inputMsg: "max fee",
          text: `Create ${xTokenSymbol}USDB Converter.`,
          fn: stepsStore.SyncStep(async step => {
            return Contract(eth, "BancorConverter").then(contract => {
              const xTokenUsdbRelay$ = get(xTokenUsdbRelay);

              return contract
                .deployBytecode(
                  getBytecode("BancorConverter"),
                  xTokenUsdbRelay$.address,
                  contractRegistry$.address,
                  get(step).fnOps.input || 30000,
                  addresses.usdbToken,
                  500000
                )
                .send({
                  from: account
                });
            });
          }),
          async after(receipt) {
            const address = bufferToHex(receipt.contractAddress).substring(2);
            const relay = await Contract(eth, "BancorConverter", address);

            xTokenUsdbConverter.update(() => {
              return relay;
            });
            storage.save("xTokenUsdbConverter", address);

            const conversions = await get(xTokenUsdbConverter)
              .methods.conversionsEnabled()
              .call();
            xTokenUsdbConverterConversions.update(() => conversions);

            return receipt;
          }
        })
      );
    }

    const pushAddConnector = () => {
      steps.push(
        stepsStore.Step({
          text: `Add ${xTokenSymbol} as a connector to the new converter.`,
          fn: stepsStore.SyncStep(async () => {
            const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

            return xTokenUsdbConverter$.methods
              .addConnector(xToken$.address, 500000, false)
              .send({
                from: account
              });
          })
        })
      );
    };
    // addConnector to converter
    if (!get(xTokenUsdbConverter)) {
      pushAddConnector();
    } else {
      const converter$ = get(xTokenUsdbConverter);

      const connectorCount = await converter$.methods
        .connectorTokenCount()
        .call()
        .then(value => Number(value));

      if (connectorCount < 2) {
        pushAddConnector();
      }
    }

    // set conversion fee on converter creation
    steps.push(
      stepsStore.Step({
        inputMsg: "fee",
        text: `Set conversion fee.`,
        fn: stepsStore.SyncStep(async step => {
          const converter$ = get(xTokenUsdbConverter);

          return converter$.methods
            .setConversionFee(get(step).fnOps.input || 1000)
            .send({
              from: account
            });
        })
      })
    );

    const pushIssueTokens = () => {
      steps.push(
        stepsStore.Step({
          inputMsg: "amount to issue",
          text: `Issue new ${xTokenSymbol}USDB tokens.`,
          fn: stepsStore.SyncStep(async step => {
            const xTokenUsdbRelay$ = get(xTokenUsdbRelay);

            // TODO: improve
            return xTokenUsdbRelay$.methods
              .issue(account, toWei(get(step).fnOps.input || 1, "ether"))
              .send({
                from: account
              });
          })
        })
      );
    };
    // issue tokens
    if (!get(xTokenUsdbRelay)) {
      pushIssueTokens();
    } else {
      const xTokenUsdbRelay$ = get(xTokenUsdbRelay);
      const supply = await xTokenUsdbRelay$.methods
        .totalSupply()
        .call()
        .then(res => Number(res));

      if (supply === 0) {
        pushIssueTokens();
      }
    }

    const pushAddToRegistry = () => {
      steps.push(
        stepsStore.Step({
          text: `Add converter to the converter registry.`,
          fn: stepsStore.SyncStep(async () => {
            const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

            return converterRegistry$.methods
              .registerConverter(xToken$.address, xTokenUsdbConverter$.address)
              .send({
                from: account
              });
          })
        })
      );
    };
    // add converter to converter registry
    if (!get(xTokenUsdbConverter)) {
      pushAddToRegistry();
    } else {
      const convertersCount = await converterRegistry$.methods
        .converterCount(xToken$.address)
        .call()
        .then(value => Number(value));

      if (convertersCount < 2) {
        pushAddToRegistry();
      }
    }

    const pushTransferOwnership = () => {
      steps.push(
        stepsStore.Step({
          text: `Transfer ${xTokenSymbol}USDB ownership to the new converter.`,
          fn: stepsStore.SyncStep(async () => {
            const xTokenUsdbRelay$ = get(xTokenUsdbRelay);
            const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

            return xTokenUsdbRelay$.methods
              .transferOwnership(xTokenUsdbConverter$.address)
              .send({
                from: account
              });
          })
        })
      );
    };
    // transfer ownership
    if (!get(xTokenUsdbConverter)) {
      pushTransferOwnership();
    } else {
      const xTokenUsdbRelay$ = get(xTokenUsdbRelay);
      const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

      const owner = await xTokenUsdbRelay$.methods
        .owner()
        .call()
        .then(res => bufferToHex(res.buffer));

      const newOwner = await xTokenUsdbRelay$.methods
        .newOwner()
        .call()
        .then(res => bufferToHex(res.buffer));

      const converterIsOwner = Address.fromString(owner).equals(
        Address.fromString(xTokenUsdbConverter$.address)
      );
      const converterIsNewOwner = Address.fromString(newOwner).equals(
        Address.fromString(xTokenUsdbConverter$.address)
      );

      if (!converterIsOwner && !converterIsNewOwner) {
        pushTransferOwnership();
      }
    }

    const pushAcceptOwnership = () => {
      steps.push(
        stepsStore.Step({
          text: `Converter will accept ownership.`,
          fn: stepsStore.SyncStep(async () => {
            const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

            return xTokenUsdbConverter$.methods.acceptTokenOwnership().send({
              from: account
            });
          })
        })
      );
    };
    // accept ownership
    if (!get(xTokenUsdbConverter)) {
      pushAcceptOwnership();
    } else {
      const xTokenUsdbRelay$ = get(xTokenUsdbRelay);
      const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

      const owner = await xTokenUsdbRelay$.methods
        .owner()
        .call()
        .then(res => bufferToHex(res.buffer));

      const ownerIsConverter = Address.fromString(
        xTokenUsdbConverter$.address
      ).equals(Address.fromString(owner));

      if (!ownerIsConverter) {
        pushAcceptOwnership();
      }
    }

    const pushLiquidate = () => {
      steps.push(
        stepsStore.Step({
          inputMsg: `amount of ${xTokenSymbol}BNT tokens to liquidate`,
          text: `Liquidate ${xTokenSymbol}BNT tokens.`,
          fn: stepsStore.SyncStep(async step => {
            const xTokenBntConverter$ = get(xTokenBntConverter);

            const input = toWei(get(step).fnOps.input || 1, "ether");

            return xTokenBntConverter$.methods.liquidate(input).send({
              from: account
            });
          })
        })
      );
    };
    // liquidate
    if (!get(xTokenBntConverter)) {
      pushLiquidate();
    } else {
      const bntToken$ = get(bntToken);
      const xTokenBntConverter$ = get(xTokenBntConverter);

      const balance = await bntToken$.methods
        .balanceOf(xTokenBntConverter$.address)
        .call()
        .then(res => Number(res));

      if (balance > 0) {
        pushLiquidate();
      }
    }

    // reset BNT allowance to 0
    steps.push(
      stepsStore.Step({
        text: "Reset BNT token allowance to 0.",
        fn: stepsStore.SyncStep(async () => {
          const bntToken$ = get(bntToken);
          const bancorNetwork$ = get(bancorNetwork);

          return bntToken$.methods.approve(bancorNetwork$.address, 0).send({
            from: account
          });
        })
      })
    );

    // approve bancor network
    steps.push(
      stepsStore.Step({
        inputMsg: `approval amount`,
        text: "Approve BNT token withdrawal.",
        fn: stepsStore.SyncStep(async step => {
          const bntToken$ = get(bntToken);
          const bancorNetwork$ = get(bancorNetwork);

          const input = toWei(get(step).fnOps.input || 1, "ether");

          return bntToken$.methods.approve(bancorNetwork$.address, input).send({
            from: account
          });
        })
      })
    );

    // convert bnt to usdb
    steps.push(
      stepsStore.Step({
        inputMsg: `amount of ${xTokenSymbol}BNT tokens to exchange`,
        text: `Exchange BNT for USDB.`,
        fn: stepsStore.SyncStep(async step => {
          const bancorNetwork$ = get(bancorNetwork);
          const input = toWei(get(step).fnOps.input || 1, "ether");

          return bancorNetworkFns.convert(bancorNetwork$, input);
        })
      })
    );

    // reset USDB allowance to 0
    steps.push(
      stepsStore.Step({
        text: "Reset USDB token allowance to 0.",
        fn: stepsStore.SyncStep(async () => {
          const usdbToken$ = get(usdbToken);
          const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

          return usdbToken$.methods
            .approve(xTokenUsdbConverter$.address, 0)
            .send({
              from: account
            });
        })
      })
    );

    // approve bancor network
    steps.push(
      stepsStore.Step({
        inputMsg: `approval amount`,
        text: "Approve USDB token withdrawal.",
        fn: stepsStore.SyncStep(async step => {
          const usdbToken$ = get(usdbToken);
          const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

          const input = toWei(get(step).fnOps.input || 1, "ether");

          return usdbToken$.methods
            .approve(xTokenUsdbConverter$.address, input)
            .send({
              from: account
            });
        })
      })
    );

    // fund new pool
    steps.push(
      stepsStore.Step({
        inputMsg: `amount of ${xTokenSymbol}USDB tokens to fund`,
        text: `Fund new converter.`,
        fn: stepsStore.SyncStep(async step => {
          const usdbToken$ = get(usdbToken);
          const xTokenUsdbConverter$ = get(xTokenUsdbConverter);

          // const balance = await usdbToken$.methods.balanceOf(account).call();
          const input = toWei(get(step).fnOps.input || 1, "ether");

          return xTokenUsdbConverter$.methods.fund(input).send({
            from: account
          });
        })
      })
    );

    stepsStore.addSteps(steps);
  } catch (err) {
    errorMsg.update(() => "Something unexpected happened");
  }
};
