import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import StablePoolFactory from '@balancer-labs/v2-deployments/tasks/20210624-stable-pool/abi/StablePoolFactory.json';
import Vault from '@balancer-labs/v2-deployments/tasks/20210418-vault/abi/Vault.json';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import {
  getAbiEncodedConstructorArguments,
  getBufferPeriodDuration,
  getPauseWindowDurationForPool,
  getPoolAddressAndBlockHashFromTransaction,
  getTaskOutputFile,
  getVaultAddress,
  hasPoolBeenDeployed,
  joinPool,
  savePoolDeployment,
  verifyPool,
} from './helpers';
import StablePool from '@balancer-labs/v2-deployments/tasks/20210624-stable-pool/abi/StablePool.json';
import StablePoolFactoryBuildInfo from '@balancer-labs/v2-deployments/tasks/20210624-stable-pool/build-info/StablePoolFactory.json';
import { BuildInfo } from 'hardhat/types';
import logger from '@balancer-labs/v2-deployments/src/logger';

interface CreateStablePoolParams {
  name: string;
  symbol: string;
  tokens: string[];
  amplificationParameter: number;
  initialBalances: BigNumber[];
  swapFeePercentage: BigNumber;
  owner?: string;
  etherscanApiKey: string;
}

export async function createStablePool(params: CreateStablePoolParams): Promise<void> {
  if (hasPoolBeenDeployed(params.symbol)) {
    return;
  }

  const { name, symbol, tokens, amplificationParameter, swapFeePercentage, owner, initialBalances } = params;
  const stablePoolFactoryAddress = getTaskOutputFile('20210624-stable-pool').StablePoolFactory;
  const vaultAddress = getVaultAddress();
  const factory = await ethers.getContractAt(StablePoolFactory, stablePoolFactoryAddress);
  const vault = await ethers.getContractAt(Vault, vaultAddress);

  logger.info('Calling create on the StablePoolFactory...');
  const tx = await factory.create(
    name,
    symbol,
    tokens,
    amplificationParameter,
    swapFeePercentage,
    owner || ZERO_ADDRESS
  );

  const { poolAddress, blockHash } = await getPoolAddressAndBlockHashFromTransaction(tx);

  // We're going to need the PoolId later, so ask the contract for it
  const pool = await ethers.getContractAt(StablePool, poolAddress);
  const poolId = await pool.getPoolId();

  logger.success(`Successfully deployed the pool at address ${poolAddress} with id ${poolId}`);
  logger.info(`Pool deployment block hash: ${blockHash}`);

  await verifyStablePool({
    ...params,
    poolAddress,
    blockHash,
  });

  await joinPool({
    vault,
    poolId,
    tokens,
    initialBalances,
  });

  savePoolDeployment(symbol, poolAddress, poolId, blockHash, { ...params });
}

async function verifyStablePool({
  name,
  symbol,
  tokens,
  amplificationParameter,
  swapFeePercentage,
  poolAddress,
  blockHash,
  etherscanApiKey,
  owner,
}: CreateStablePoolParams & { poolAddress: string; blockHash: string }) {
  const vaultAddress = getVaultAddress();
  const pool = await ethers.getContractAt(StablePool, poolAddress);
  const pauseWindowDuration = await getPauseWindowDurationForPool(pool, blockHash);
  const bufferPeriodDuration = getBufferPeriodDuration();

  const abiEncodedConstructorArguments = getAbiEncodedConstructorArguments(StablePool, [
    vaultAddress,
    name,
    symbol,
    tokens,
    amplificationParameter,
    swapFeePercentage,
    pauseWindowDuration,
    bufferPeriodDuration,
    owner || ZERO_ADDRESS,
  ]);

  await verifyPool({
    contractName: 'StablePool',
    poolAddress,
    abiEncodedConstructorArguments,
    buildInfo: StablePoolFactoryBuildInfo as BuildInfo,
    etherscanApiKey,
  });
}
