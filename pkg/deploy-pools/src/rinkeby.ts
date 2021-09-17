import { createWeightedPool } from './createWeightedPool';
import { toNormalizedWeights } from '@balancer-labs/balancer-js/src';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { getVaultAddress } from './helpers';
import { ethers } from 'hardhat';
import { createStablePool } from './createStablePool';

const tokens = {
  WBTC: { symbol: 'WBTC', decimals: 8, address: '0xb4761d0481B4f7a8A858D2796eEF3DAa2f3D9D2c' },
  USDC: { symbol: 'USDC', decimals: 6, address: '0x70b55Af71B29c5Ca7e67bD1995250364C4bE5554' },
  fUSDT: { symbol: 'fUSDT', decimals: 6, address: '0x40D26F06DefEe453bCFCAa61Badb16883E4ee26C' },
  WETH: { symbol: 'WETH', decimals: 18, address: '0x80dD2B80FbcFB06505A301d732322e987380EcD6' },
  LINK: { symbol: 'LINK', decimals: 18, address: '0xB8Fecb889862C486BccE52222c7EFe9b30371aD5' },
  DAI: { symbol: 'DAI', decimals: 18, address: '0x12c615406F20eDcBDa50888f9fd6734dC4836417' },
  FUSD: { symbol: 'FUSD', decimals: 18, address: '0xC29eBfac22314Fb2C5cE0A9F995Dc0A6dA2CBE7e' },
  BEETS: { symbol: 'BEETS', decimals: 18, address: '0x8850Fd0C65d9B2B168153FAc6bAa269A566c4ef7' },
  SPIRIT: { symbol: 'SPIRIT', decimals: 18, address: '0x6F00D64b42aF8f449dB15B0b3ee3B444550c4826' },
  BOO: { symbol: 'BOO', decimals: 18, address: '0x4176603b0712407B1D7DCcE3ACaB685f7219E6dd' },
  SCREAM: { symbol: 'SCREAM', decimals: 18, address: '0x0d543D9528e17Cf55Ac73660407F712b5a3085AB' },
  TAROT: { symbol: 'TAROT', decimals: 18, address: '0xdA05941B0a17a1b537C711094c575665c116D237' },
  STEAK: { symbol: 'STEAK', decimals: 18, address: '0x64Fe8666Ccbd87E819a398eeB79580255d00d8EA' },
  LQDR: { symbol: 'LQDR', decimals: 18, address: '0x6A9598780F937c10fFFccb9Dbf9A792d122CC538' },
  ICE: { symbol: 'ICE', decimals: 18, address: '0xcAbdF4994C71e48d8E8af66457658Fc7CD29400f' },
  FTM: { symbol: 'FTM', decimals: 18, address: '0x0483863540CB2C1ea77F7827db43ee160a0Ad7AC' },
};

async function main() {
  await createStablePool({
    name: 'Test Stable Pool',
    symbol: 'USDC-DAI-BLPT',
    //the tokens here must be sorted by address. if you get an error code 101, you're tokens are not sorted in the correct order
    tokens: [tokens.DAI.address, tokens.USDC.address],
    initialBalances: [fp(50), BigNumber.from(50e6)],
    amplificationParameter: 200,
    swapFeePercentage: fp(0.0005),
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
  });

  //getVaultAddress();
  /*await verifyWeightedPool({
    senderAddress: DEPLOYER_ADDRESS,
    name: 'Test pool',
    symbol: 'TEST',
    //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
    tokens: [tokens.FTM.address, tokens.WETH.address, tokens.WBTC.address],
    weights: toNormalizedWeights([fp(33.333333333333333333), fp(33.333333333333333333), fp(33.333333333333333333)]),
    initialBalances: [fp(36078.094488188976378), fp(13.801539823968481), fp(1, 1e8)],
    swapFeePercentage: fp(0.0025),
    weightedPoolFactoryAddress: rinkebyContractAddresses.weightedPoolFactory,
    vaultAddress: rinkebyContractAddresses.vault,
    poolAddress: '0x90587EEF3C3E1303525AF3d21dd67CE691C32b36',
    blockHash: '0x06984fb3506b9bbb2873d329e3800faa6bd204c4b468cafbe477b2f2bb315e2b',
  });*/
  /*await createWeightedPool({
    senderAddress: DEPLOYER_ADDRESS,
    name: 'The DEGEN DeFi Pool',
    symbol: 'DEGEN-DeFi-BLPT',
    //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
    tokens: [
      tokens.SCREAM.address,
      tokens.BOO.address,
      tokens.STEAK.address,
      tokens.LQDR.address,
      tokens.SPIRIT.address,
      tokens.ICE.address,
      tokens.TAROT.address,
    ],
    weights: toNormalizedWeights([fp(20), fp(20), fp(20), fp(10), fp(10), fp(10), fp(10)]),
    initialBalances: [
      fp(12.318305001231831),
      fp(56.98005698005698),
      fp(168.918918918918919),
      fp(167.224080267558528),
      fp(6899.692273724591883),
      fp(234.741784037558685),
      fp(393.700787401574803),
    ],
    swapFeePercentage: fp(0.003),
    weightedPoolFactoryAddress: rinkebyContractAddresses.weightedPoolFactory,
    vaultAddress: rinkebyContractAddresses.vault,
  });*/
  /*await createWeightedPool({
      senderAddress: DEPLOYER_ADDRESS,
      name: 'The FTM DeFi Pool',
      symbol: 'FTM-DeFi-BLPT',
      //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
      tokens: [
          tokens.FTM.address,
          tokens.SCREAM.address,
          tokens.BOO.address,
          tokens.SPIRIT.address,
          tokens.LINK.address,
      ],
      weights: toNormalizedWeights([fp(40), fp(10), fp(10), fp(10), fp(30)]),
      initialBalances: [ //these balances are not weighted
          fp(1000),
          fp(15.70033378662381),
          fp(72.654462242562929),
          fp(8796.719585515196853),
          fp(46.932742054693274),
      ],
      swapFeePercentage: fp(0.003),
      weightedPoolFactoryAddress: rinkebyContractAddresses.weightedPoolFactory,
      vaultAddress: rinkebyContractAddresses.vault,
  });*/
  /*await createWeightedPool({
      senderAddress: DEPLOYER_ADDRESS,
      name: 'The FTM Bull Pool',
      symbol: 'FTM-BULL-BLPT',
      //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
      tokens: [tokens.FTM.address, tokens.USDC.address],
      weights: toNormalizedWeights([fp(70), fp(30)]),
      initialBalances: [fp(1000), fp(1270, 1e6)],
      swapFeePercentage: fp(0.0025),
      weightedPoolFactoryAddress: rinkebyContractAddresses.weightedPoolFactory,
      vaultAddress: rinkebyContractAddresses.vault,
  });*/
  /*await createWeightedPool({
    senderAddress: DEPLOYER_ADDRESS,
    name: 'Test pool',
    symbol: 'TEST',
    //the tokens here must be sorted by address. if you get an error code 101, your tokens are not sorted in the correct order
    tokens: [tokens.FTM.address, tokens.WETH.address, tokens.WBTC.address],
    weights: toNormalizedWeights([fp(33.333333333333333333), fp(33.333333333333333333), fp(33.333333333333333333)]),
    initialBalances: [fp(360.78094488188976378), fp(0.13801539823968481), BigNumber.from(1e6)],
    swapFeePercentage: fp(0.0025),
    weightedPoolFactoryAddress: rinkebyContractAddresses.weightedPoolFactory,
    vaultAddress: rinkebyContractAddresses.vault,
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
  });*/
  /*await createStablePool({
      senderAddress: DEPLOYER_ADDRESS,
      name: 'The Stable Pool',
      symbol: 'USDC-DAI-BLPT',
      //the tokens here must be sorted by address. if you get an error code 101, you're tokens are not sorted in the correct order
      tokens: [tokens.DAI.address, tokens.USDC.address],
      initialBalances: [fp(50), fp(50, 1e6)],
      amplificationParameter: 200,
      swapFeePercentage: fp(0.0005),
      stablePoolFactoryAddress: rinkebyContractAddresses.stablePoolFactory,
      vaultAddress: rinkebyContractAddresses.vault,
  });*/
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
