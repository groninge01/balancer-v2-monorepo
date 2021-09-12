import { ethers } from 'hardhat';
import { actionId } from '../pvt/helpers/src/models/misc/actions';
import { Contract } from 'ethers';

export async function grantRoles(adminAddress: string, roles: string[], authorizer: Contract) {
  for (const role of roles) {
    const tx = await authorizer.grantRole(role, adminAddress);
    const receipt = tx.await();
    console.log(receipt);
  }
}

type InitialRoleSetupConfig = {
  adminAddress: string;
  feeCollectorAddress: string;
  authorizerAddress: string;
  vaultAddress: string;
  protocolFeeCollectorAddress: string;
};

async function setupInitialRoles(config: InitialRoleSetupConfig) {
  const authorizer = await ethers.getContractAt('Authorizer', config.authorizerAddress);
  const feesCollector = await ethers.getContractAt('ProtocolFeesCollector', config.protocolFeeCollectorAddress);
  const vault = await ethers.getContractAt('Vault', config.vaultAddress);

  // admin roles (either timelock or wallet until built in support for timelock in authorizer)
  await grantRoles(
    config.adminAddress,
    [
      await actionId(feesCollector, 'setFlashLoanFeePercentage'),
      await actionId(feesCollector, 'setSwapFeePercentage '),
      await actionId(feesCollector, 'setSwapFeePercentage '),
      await actionId(vault, 'setPaused'),
    ],
    authorizer
  );

  // fee collector (withdraw fees)
  await grantRoles(config.feeCollectorAddress, [await actionId(feesCollector, 'withdrawCollectedFees')], authorizer);
}

// grantFeeRoles('')
//   .then(() => {
//     console.log('granted roles');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
