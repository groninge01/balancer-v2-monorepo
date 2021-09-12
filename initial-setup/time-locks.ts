import moment from 'moment';
import * as etherTypes from 'ethers';
import { ethers } from 'hardhat';

export type TimelockTransaction = {
  targetContract: etherTypes.Contract;
  function: {
    identifier: string;
    args: any[];
  };
  // eth sent with transaction
  value: number;
  eta: number; // in unix seconds
  timelockContract: etherTypes.Contract;
};
export async function queueTransaction(transaction: TimelockTransaction) {
  const functionFragment = transaction.targetContract.interface.getFunction(transaction.function.identifier);
  const params = transaction.targetContract.interface._encodeParams(functionFragment.inputs, transaction.function.args);
  const signature = functionFragment.format();

  transaction.timelockContract.queueTransaction(
    transaction.targetContract.address,
    transaction.value,
    signature,
    params,
    transaction.eta
  );
}

async function changeSwapFeePercentage(feeCollectorAddress: string, timelockAddress: string) {
  const feeCollector = await ethers.getContractAt('ProtocolFeesCollector', feeCollectorAddress);
  const timelock = await ethers.getContractAt('Timelock', timelockAddress);

  await queueTransaction({
    targetContract: feeCollector,
    timelockContract: timelock,
    eta: moment().add(10, 'minutes').unix(),
    value: 0,
    function: {
      identifier: 'setSwapFeePercentage',
      args: [200000000],
    },
  });
}

changeSwapFeePercentage('123', '123')
  .then(() => {
    console.log('changes swap fee percentage');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
