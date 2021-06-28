import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import {
  encodeCalldataAuthorization,
  signSetRelayerApprovalAuthorization,
} from '@balancer-labs/v2-helpers/src/models/misc/signatures';

import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';

import { MAX_UINT256 } from '@balancer-labs/v2-helpers/src/constants';
import Vault from '../../../pvt/helpers/src/models/vault/Vault';

const setup = async () => {
  const [, admin] = await ethers.getSigners();

  // Deploy Balancer Vault
  const vault = await Vault.create({ admin });

  const relayer = await deploy('BaseRelayer', { args: [vault.address] });

  return {
    data: {},
    contracts: {
      relayer,
      vault,
    },
  };
};

describe('BaseRelayer', function () {
  let relayer: Contract, vault: Vault;
  let admin: SignerWithAddress, signer: SignerWithAddress;

  let approvalAuthorisation: string;

  before('deploy base contracts', async () => {
    [, admin, signer] = await ethers.getSigners();
  });

  sharedBeforeEach('set up relayer', async () => {
    const { contracts } = await setup();

    relayer = contracts.relayer;
    vault = contracts.vault;

    const approval = vault.instance.interface.encodeFunctionData('setRelayerApproval', [
      signer.address,
      relayer.address,
      true,
    ]);
    const signature = await signSetRelayerApprovalAuthorization(vault.instance, signer, relayer, approval);
    approvalAuthorisation = encodeCalldataAuthorization('0x', MAX_UINT256, signature);
  });

  describe('setRelayerApproval', () => {
    context('when relayer is allowed to set approval', () => {
      sharedBeforeEach('authorise relayer', async () => {
        const authorizer = vault.authorizer as Contract;
        const setRelayerApproval = actionId(vault.instance, 'setRelayerApproval');
        await authorizer.connect(admin).grantRole(setRelayerApproval, relayer.address);
      });

      it('sets the desired approval for the relayer', async () => {
        const approveTx = await relayer.connect(signer).setRelayerApproval(true, approvalAuthorisation);
        const approveReceipt = await approveTx.wait();

        expectEvent.inIndirectReceipt(approveReceipt, vault.instance.interface, 'RelayerApprovalChanged', {
          relayer: relayer.address,
          sender: signer.address,
          approved: true,
        });

        const revokeTx = await relayer.connect(signer).setRelayerApproval(false, '0x');
        const revokeReceipt = await revokeTx.wait();

        expectEvent.inIndirectReceipt(revokeReceipt, vault.instance.interface, 'RelayerApprovalChanged', {
          relayer: relayer.address,
          sender: signer.address,
          approved: false,
        });
      });
    });
    context('when relayer is not allowed to set approval', () => {
      it('reverts', async () => {
        await expect(relayer.connect(signer).setRelayerApproval(true, approvalAuthorisation)).to.be.revertedWith(
          'SENDER_NOT_ALLOWED'
        );
      });
    });
  });

  describe('multicall', () => {
    context('when sending ETH', () => {
      it('refunds the unused ETH', async () => {
        // Pass in 100 wei which will not be used
        const value = 100;
        const userBalanceBefore = await ethers.provider.getBalance(signer.address);

        const tx = await relayer.connect(signer).multicall([], { value });
        const receipt = await tx.wait();

        const txCost = tx.gasPrice.mul(receipt.gasUsed);
        const expectedBalanceAfter = userBalanceBefore.sub(txCost);
        const userBalanceAfter = await ethers.provider.getBalance(signer.address);

        expect(userBalanceAfter).to.be.eq(expectedBalanceAfter);
        expect(await ethers.provider.getBalance(vault.address)).to.be.eq(0);
        expect(await ethers.provider.getBalance(relayer.address)).to.be.eq(0);
      });
    });

    context('when relayer is allowed to set approval', () => {
      sharedBeforeEach('authorise relayer', async () => {
        const authorizer = vault.authorizer as Contract;
        const setRelayerApproval = actionId(vault.instance, 'setRelayerApproval');
        await authorizer.connect(admin).grantRole(setRelayerApproval, relayer.address);
      });

      context('when not approved by sender', () => {
        context('when the first call gives permanent approval', () => {
          it("doesn't require signatures on further calls", async () => {
            const setApproval = relayer.interface.encodeFunctionData('setRelayerApproval', [
              true,
              approvalAuthorisation,
            ]);

            const EMPTY_AUTHORISATION = '0x';
            const revokeApproval = relayer.interface.encodeFunctionData('setRelayerApproval', [
              false,
              EMPTY_AUTHORISATION,
            ]);

            const tx = await relayer.connect(signer).multicall([setApproval, revokeApproval]);
            const receipt = await tx.wait();

            // Check that approval revocation was applied.
            expectEvent.inIndirectReceipt(receipt, vault.instance.interface, 'RelayerApprovalChanged', {
              relayer: relayer.address,
              sender: signer.address,
              approved: false,
            });
          });
        });
      });
    });
  });
});
