/*
  localstorage abstraction in order
  to always key items with networkId + address
*/
import { get as getValue } from "svelte/store";
import { networkId } from "../stores/eth";
import { xToken } from "../stores/app";

const createKey = key => {
  const networkId$ = getValue(networkId);
  const xToken$ = getValue(xToken);

  return `${networkId$}-${xToken$.address}-${key}`;
};

export const save = (key, value) => {
  localStorage.setItem(createKey(key), value);
};

export const get = key => {
  return localStorage.getItem(createKey(key)) || undefined;
};
