import { get } from "svelte/store";
import {
  toWei,
  fromWei,
  utf8ToHex,
  hexToNumberString,
  bufferToHex
} from "web3x-es/utils";
import { eth, account } from "../stores/eth";
import {
  contractRegistry,
  bntToken,
  usdbToken,
  usdbConverter
} from "../stores/app";
import Contract from "./Contract";

export const getRate = async (bancorNetwork, amount) => {
  const usdbToken$ = get(usdbToken);
  const usdbConverter$ = get(usdbConverter);
  const bntToken$ = get(bntToken);
  const path = [usdbToken$.address, usdbConverter$.address, bntToken$.address];

  const { receiveAmount } = await bancorNetwork.methods
    .getReturnByPath(path, amount)
    .call()
    .then(res => ({
      receiveAmount: res["0"],
      fee: res["1"]
    }));

  if (receiveAmount) {
    return receiveAmount;
  } else {
    return 0;
  }
};

export const convert = async (bancorNetwork, amount) => {
  const usdbToken$ = get(usdbToken);
  const usdbConverter$ = get(usdbConverter);
  const bntToken$ = get(bntToken);
  const path = [bntToken$.address, usdbConverter$.address, usdbToken$.address];

  return bancorNetwork.methods.claimAndConvert(path, amount, 1).send({
    from: get(account)
  });
};
