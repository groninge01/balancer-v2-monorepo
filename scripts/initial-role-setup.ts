import { ethers } from 'hardhat';
import { actionId } from '../pvt/helpers/src/models/misc/actions';
import * as assert from 'assert';

const authorizerAddress = '';
const protocolFeeCollectorAddress = '';
const vaultAddress = '';
const timelockAddress = '';

const initialAdminAddress = '';
const withdrawalAdminAddress = '';

type RoleAction = 'grant' | 'revoke';

type BaseRoleConfig = {
  adminAddress: string;
};

async function setManagementRoles(adminAddress: string, action: RoleAction) {
  const authorizer = await ethers.getContractAt('Authorizer', authorizerAddress);
  const feesCollector = await ethers.getContractAt('ProtocolFeesCollector', protocolFeeCollectorAddress);
  const vault = await ethers.getContractAt('Vault', vaultAddress);

  const roles = [
    await actionId(feesCollector, 'setFlashLoanFeePercentage'),
    await actionId(feesCollector, 'setSwapFeePercentage '),
    await actionId(feesCollector, 'setSwapFeePercentage '),
    await actionId(vault, 'setPaused'),
  ];
  let tx;
  if (action === 'grant') {
    tx = await authorizer.grantRoles(roles, adminAddress);
  } else {
    tx = await authorizer.revokeRoles(roles, adminAddress);
  }
  const receipt = await tx.wait();
  console.log(`${action} management roles : `, receipt);
}

async function setFeeWithdrawalRole(adminAddress: string, action: RoleAction) {
  const authorizer = await ethers.getContractAt('Authorizer', authorizerAddress);
  const feesCollector = await ethers.getContractAt('ProtocolFeesCollector', protocolFeeCollectorAddress);
  const roles = [await actionId(feesCollector, 'withdrawCollectedFees')];
  let tx;
  if (action === 'grant') {
    tx = await authorizer.grantRoles(roles, adminAddress);
  } else {
    tx = await authorizer.revokeRoles(roles, adminAddress);
  }
  const receipt = tx.wait();
  console.log(`${action} fee withdrawal role : `, receipt);
}

type PausableRoleConfig = {
  adminAddress: string;
  pausableContract: string;
  pausableContractAddress: string;
};

async function setPausableRole(config: PausableRoleConfig, action: RoleAction) {
  const authorizer = await ethers.getContractAt('Authorizer', authorizerAddress);
  const pausableContract = await ethers.getContractAt(config.pausableContract, config.pausableContractAddress);

  const roles = [await actionId(pausableContract, 'setPaused')];
  let tx;
  if (action === 'grant') {
    tx = await authorizer.grantRoles(roles, config.adminAddress);
  } else {
    tx = await authorizer.revokeRoles(roles, config.adminAddress);
  }
  const receipt = await tx.wait();
  console.log(`${action} pausable role : `, receipt);
}

async function setDefaultAdminRole(adminAddress: string, action: RoleAction) {
  const authorizer = await ethers.getContractAt('Authorizer', authorizerAddress);

  const roles = [await authorizer.DEFAULT_ADMIN_ROLE()];
  let tx;
  if (action === 'grant') {
    tx = await authorizer.grantRoles(roles, adminAddress);
  } else {
    tx = await authorizer.revokeRoles(roles, adminAddress);
  }

  const receipt = await tx.wait();
  console.log(`${action} default admin role: `, receipt);
}

/*
    scripts to run after deployment
 */

async function initialRoleSetup() {
  console.log(`Granting management roles to initial admin ${initialAdminAddress}`);
  await setManagementRoles(initialAdminAddress, 'grant');
  console.log('------------------- done ----------------------\n\n');
  console.log(`Granting fee withdrawal role to ${withdrawalAdminAddress}`);
  await setFeeWithdrawalRole(withdrawalAdminAddress, 'grant');
  console.log('------------------- done ----------------------');
}

async function grantDefaultAdminRoleToTimelock() {
  console.log(`Granting default admin role to timelock ${timelockAddress}`);
  await setDefaultAdminRole(timelockAddress, 'grant');
}

async function grantManagementRolesToTimelock() {
  console.log(`Granting management roles to timelock ${timelockAddress}`);
  await setManagementRoles(timelockAddress, 'grant');
  console.log('------------------- done ----------------------\n\n');
}

async function revokeManagementRolesFromInitialAdmin() {
  console.log(`Revoking management roles from initial admin ${initialAdminAddress}`);
  await setManagementRoles(initialAdminAddress, 'revoke');
  console.log('------------------- done ----------------------\n\n');
}

async function dangerously__revokeDefaultAdminRoleFromInitialAdmin() {
  const authorizer = await ethers.getContractAt('Authorizer', authorizerAddress);
  const timelockHasAdminRole = await authorizer.canPerform(await authorizer.DEFAULT_ADMIN_ROLE(), timelockAddress);
  if (!timelockHasAdminRole) {
    throw new Error('Timelock has not been granted the default admin!!!');
  }

  await setDefaultAdminRole(initialAdminAddress, 'revoke');
}

initialRoleSetup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .then(() => grantDefaultAdminRoleToTimelock())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .then(() => grantManagementRolesToTimelock())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .then(() => revokeManagementRolesFromInitialAdmin())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// .then(() => dangerously__revokeDefaultAdminRoleFromInitialAdmin())
// .catch((error) => {
//   console.error(error);
//   process.exit(1);
// });
