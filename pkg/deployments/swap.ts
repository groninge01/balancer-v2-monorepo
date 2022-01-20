import { ethers } from 'hardhat';
import { ExitPoolRequest, FundManagement, JoinPoolRequest, SingleSwap } from '@balancer-labs/balancer-js/src';
import { MAX_UINT256 } from '@balancer-labs/v2-helpers/src/constants';
import { BigNumber } from 'ethers';
import VaultAbi from '@balancer-labs/v2-deployments/tasks/20210418-vault/abi/Vault.json';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

const SWAPPER_ADDRESS = '0x4fbe899d37fb7514adf2f41B0630E018Ec275a0C';
const POOL_ID = '0xb4aaf98cca7170dc6dcfb530847db9d7569b419400000000000000000000007c';
const VAULT_ADDRESS = '0xF07513C68C55A31337E3b58034b176A15Dce16eD';
const BB_YV_USD = '0xf0CF2acD59D971c4a629E9F9c1642fB42F7425e1';
const BB_YV_USD_POOL_ID = '0xf0cf2acd59d971c4a629e9f9c1642fb42f7425e100000000000000000000007e';
const BB_YV_USDC_POOL_ID = '0xc4b8327aeb95fe6c82fd0bc39ae2a5fccffc94ff00000000000000000000007d';
const BB_YV_DAI_POOL_ID = '0xb4aaf98cca7170dc6dcfb530847db9d7569b419400000000000000000000007c';
const BB_YV_USDC = '0xc4b8327AEb95FE6C82fD0bC39aE2A5fCCFfc94FF';
const BB_YV_DAI = '0xB4Aaf98Cca7170DC6DcFb530847dB9d7569B4194';

async function swap() {
  const vault = await ethers.getContractAt(VaultAbi, VAULT_ADDRESS);

  const data: SingleSwap = {
    poolId: BB_YV_USD_POOL_ID,
    kind: 0, //0 means the amount is givenIn. 1 is for giventOut
    assetIn: BB_YV_USDC,
    assetOut: BB_YV_USD,
    amount: fp(0.0000000998445),
    userData: '0x', //the user data here is not relevant on the swap
  };

  const funds: FundManagement = {
    sender: SWAPPER_ADDRESS,
    fromInternalBalance: false,
    toInternalBalance: false,
    recipient: SWAPPER_ADDRESS,
  };

  console.log('data', data);
  console.log('funds', funds);

  const transaction = await vault.swap(data, funds, BigNumber.from(0), MAX_UINT256);
  const receipt = await transaction.wait();

  console.log('receipt', receipt);
}

swap()
  .then(() => {
    console.log('done');
  })
  .catch((e) => console.log('e', e));

/*

async function joinPool() {
  const JOIN_POOL_EXACT_TOKENS_IN_FOR_BPT_OUT_TAG = 1;
  const vault = await ethers.getContractAt(VaultAbi, VAULT_ADDRESS);
  const amountsIn = [fp(2.2), BigNumber.from(1e6)];
  //because we use ExactTokensInForBPTOut, we don't set a minimumBPT. Instead we set the maxAmountsIn as the amountsIn
  const minimumBPT = fp(0);

  const abiCoder = new ethers.utils.AbiCoder();
  const userData = abiCoder.encode(
    ['uint256', 'uint256[]', 'uint256'],
    [JOIN_POOL_EXACT_TOKENS_IN_FOR_BPT_OUT_TAG, amountsIn, minimumBPT]
  );

  const data: JoinPoolRequest = {
    assets: [fantomTokens.WFTM.address, fantomTokens.USDC.address],
    //we set maxAmountsIn here because our kind is ExactTokensInForBPTOut
    maxAmountsIn: amountsIn,
    userData,
    fromInternalBalance: false,
  };
  const transaction = await vault.joinPool(POOL_ID, SWAPPER_ADDRESS, SWAPPER_ADDRESS, data);
  const receipt = await transaction.wait();
}

async function exitPool() {
  const EXIT_POOL_EXACT_BPT_IN_FOR_TOKENS_OUT_TAG = 1;
  const vault = await ethers.getContractAt(VaultAbi, VAULT_ADDRESS);
  const bptIn = fp(100);

  const abiCoder = new ethers.utils.AbiCoder();
  const userData = abiCoder.encode(['uint256', 'uint256'], [EXIT_POOL_EXACT_BPT_IN_FOR_TOKENS_OUT_TAG, bptIn]);

  const data: ExitPoolRequest = {
    assets: [fantomTokens.WFTM.address, fantomTokens.USDC.address],
    //because we use ExactBPTInForTokensOut, we don't set a minimum amount out
    minAmountsOut: [0, 0],
    userData,
    toInternalBalance: false,
  };
  const transaction = await vault.exitPool(POOL_ID, SWAPPER_ADDRESS, SWAPPER_ADDRESS, data);
  const receipt = await transaction.wait();
}
*/
