/*
  create a contract instance of name and address
  abi is downloaded from Bancor's github
  abi is cached
*/

import { Contract as EthContract, ContractAbi } from "web3x-es/contract";
import safeFetch from "./safeFetch";
import { commit, addresses } from "../env";

const abis = {};
const bytecodes = {};

const Contract = async (eth, name, address) => {
  if (!abis[name]) {
    const url = `https://rawcdn.githack.com/bancorprotocol/contracts/${commit}/solidity/build/${name}.abi`;

    abis[name] = await safeFetch(url)
      .then(res => res.json())
      .then(abi => new ContractAbi(abi));
  }

  if (!address && !bytecodes[name]) {
    const url = `https://rawcdn.githack.com/bancorprotocol/contracts/${commit}/solidity/build/${name}.bin`;

    bytecodes[name] = await safeFetch(url)
      .then(res => res.text())
      .then(bytecode => "0x" + bytecode);
  }

  return new EthContract(eth, abis[name], address, {});
};

export const getBytecode = name => bytecodes[name];

export default Contract;
