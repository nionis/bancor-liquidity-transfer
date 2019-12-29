import { get } from "svelte/store";
import { account, bancorSdk } from "../stores/eth";
import { bntToken, usdbToken } from "../stores/app";

export const getPath = (tokenSendAddress, tokenReceiveAddress) => {
  return get(bancorSdk)
    .generatePath(
      {
        blockchainType: "ethereum",
        blockchainId: tokenSendAddress
      },
      {
        blockchainType: "ethereum",
        blockchainId: tokenReceiveAddress
      }
    )
    .then(res => res.paths[0].path);
};

export const getRate = async (bancorNetwork, amount) => {
  const usdbToken$ = get(usdbToken);
  const bntToken$ = get(bntToken);
  const path = await getPath(usdbToken$.address, bntToken$.address);

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
  const bntToken$ = get(bntToken);
  const path = await getPath(bntToken$.address, usdbToken$.address);

  return bancorNetwork.methods.claimAndConvert(path, amount, 1).send({
    from: get(account)
  });
};
