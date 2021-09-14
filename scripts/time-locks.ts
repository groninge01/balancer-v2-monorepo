import moment from 'moment';
import * as etherTypes from 'ethers';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { bn } from '@balancer-labs/v2-helpers/src/numbers';

export type TimelockTransaction = {
  timelockContractAddress: string;
  targetContract: {
    name: string;
    address: string;
  };
  targetFunction: {
    identifier: string;
    args: any[];
  };
  // eth sent with transaction
  value: number;
  eta: number; // in unix seconds
};
export async function queueTransaction(transaction: TimelockTransaction) {
  const timelockContract = await ethers.getContractAt('Timelock', transaction.timelockContractAddress);
  const targetContract = await ethers.getContractAt(
    transaction.targetContract.name,
    transaction.targetContract.address
  );

  // encode function data with params
  const functionFragment = targetContract.interface.getFunction(transaction.targetFunction.identifier);
  const data = targetContract.interface.encodeFunctionData(functionFragment, transaction.targetFunction.args);

  timelockContract.queueTransaction(transaction.targetContract.address, transaction.value, 0, data, transaction.eta);
}

// swap fee percentage where 1e16 = 1%
async function changeProtocolSwapFeePercentage(
  feeCollectorAddress: string,
  timelockAddress: string,
  eta: number,
  swapFeePercentage: BigNumber
) {
  await queueTransaction({
    targetContract: {
      name: 'ProtocolFeesCollector',
      address: feeCollectorAddress,
    },
    timelockContractAddress: timelockAddress,
    eta,
    value: 0,
    targetFunction: {
      identifier: 'setSwapFeePercentage',
      args: [swapFeePercentage],
    },
  });
}

// change protocol swap fee to 10% after minimum delay of 48h
changeProtocolSwapFeePercentage('123', '123', moment().add(2, 'days').unix(), bn(10e16))
  .then(() => {
    console.log('changed protocol swap fee percentage');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
