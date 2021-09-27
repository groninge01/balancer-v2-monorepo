import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { toNormalizedWeights } from '@balancer-labs/balancer-js/src';
import LiquidityBootstrappingPool from '@balancer-labs/v2-deployments/tasks/20210721-liquidity-bootstrapping-pool/abi/LiquidityBootstrappingPool.json';
import { ethers } from 'hardhat';

async function main(): Promise<void> {
  const pool = await ethers.getContractAt(LiquidityBootstrappingPool, '0x07d91b61b149a0717952ad33d97cb4293B0bDb1a');

  console.log('calling update weights gradually');
  await pool.updateWeightsGradually(1632400366, 1632486766, toNormalizedWeights([fp(20), fp(80)]));
  console.log('success');

  console.log('calling setSwapEnabled');
  const response = await pool.setSwapEnabled(true);
  console.log('success', response);
}

main()
  .then()
  .catch((e) => {
    console.log(e);
  });
