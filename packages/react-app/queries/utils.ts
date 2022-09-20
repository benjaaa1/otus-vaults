import { ethers } from 'ethers';
import { ContractsMap } from '../utils/types';
import { FUTURES_ENDPOINT_MAINNET, FUTURES_ENDPOINT_TESTNET, OTUS_ENDPOINT_MAINNET, OTUS_ENDPOINT_TESTNET } from './constants';

export const getFuturesEndpoint = (network: ethers.providers.Network | null | undefined): string => {
	return network && network.chainId === 10
		? FUTURES_ENDPOINT_MAINNET
		: network && network.chainId === 69
		? FUTURES_ENDPOINT_TESTNET
		: FUTURES_ENDPOINT_MAINNET;
};

export const getOtusEndpoint = (network: ethers.providers.Network | null | undefined): string => {
	return network && network.chainId === 10
		? OTUS_ENDPOINT_MAINNET
		: network && network.chainId === 69
		? OTUS_ENDPOINT_TESTNET
		: OTUS_ENDPOINT_MAINNET;
};

export const getOtusContract = (
  contractName: string | null,
  contracts: ContractsMap
) => {
  if (!contractName) throw new Error(`Asset needs to be specified`)
  const contract = contracts[contractName]
  if (!contract) throw new Error(`${contractName} does not exist`)
  return contract
}

