import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const chainId = await getChainId();

  const { deployer } = await getNamedAccounts();

  if (chainId === '4002') {
    await deploy('BalancerHelpers', {
      from: deployer,
      args: ['0x974D3FF709D84Ba44cde3257C0B5B0b14C081Ce9'],
      log: true,
    });
  } else if (chainId === '250') {
    await deploy('BalancerHelpers', {
      from: deployer,
      args: ['0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce'],
      log: true,
    });
  }
}
