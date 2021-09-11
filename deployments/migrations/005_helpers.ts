import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('BalancerHelpers', {
    from: deployer,
    args: ['0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce'],
    log: true,
  });
}
