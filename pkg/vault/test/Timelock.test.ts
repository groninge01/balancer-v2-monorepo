import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import { expect } from 'chai';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import { bn } from '@balancer-labs/v2-helpers/src/numbers';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import moment from 'moment';
import { advanceTime } from '@balancer-labs/v2-helpers/src/time';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';

describe('Timelock', () => {
  let authorizer: Contract;
  let timelock: Contract;
  let admin: SignerWithAddress, user: SignerWithAddress, feeCollector: SignerWithAddress, other: SignerWithAddress;

  let vault: Vault;
  let feesCollector: Contract;

  const timelockDelay = 432000;

  before('setup', async () => {
    [, admin, user, feeCollector, other] = await ethers.getSigners();
  });

  sharedBeforeEach('deploy contracts', async () => {
    timelock = await deploy('Timelock', { args: [admin.address, timelockDelay] });
    // authorizer = await deploy('Authorizer', { args: [admin.address] });
    vault = await Vault.create({ admin });
    feesCollector = await vault.getFeesCollector();
    authorizer = vault.authorizer!;
  });

  describe('timelock admin transfer', () => {
    it('allows one time transfer by admin', async () => {
      console.log(
        'PARAAAMS',
        encodeParameters(['address', 'uint'], ['0xca206C8c897d9930AA6E94cF03eB2E5393B65e30', 172800])
      );
      await timelock.connect(admin).setPendingAdmin(user.address);
      await timelock.connect(user).acceptAdmin();
      expect(await timelock.admin()).to.equal(user.address);
    });

    it('does not allow admin transfer by admin after initial transfer', async () => {
      /*
          the admin can only be transferred once by the admin itself, afterwards it has to go through the timelock
       */
      await timelock.connect(admin).setPendingAdmin(user.address);
      await timelock.connect(user).acceptAdmin();
      await expect(timelock.connect(user).setPendingAdmin(other.address)).to.be.revertedWith(
        'Timelock::setPendingAdmin: Call must come from Timelock.'
      );
    });

    it('allows admin transfer by timelock after initial transfer', async () => {
      await timelock.connect(admin).setPendingAdmin(user.address);
      await timelock.connect(user).acceptAdmin();

      // now we wanna transfer admin to 'other' signer
      const data = timelock.interface.encodeFunctionData('setPendingAdmin', [other.address]);
      const eta = moment().add(6, 'days').unix();

      await timelock.connect(user).queueTransaction(timelock.address, '0', 0, data, eta);

      // advance 6days and a bit
      await advanceTime(518500);
      await timelock.connect(user).executeTransaction(timelock.address, '0', 0, data, eta);
      await timelock.connect(other).acceptAdmin();

      expect(await timelock.admin()).to.equal(other.address);
    });
  });

  describe('timelocked transaction execution', () => {
    it('queues transaction when sender is admin and eta > delay', async () => {
      const updatedSwapFeePercentage = bn(20e16);
      const functionFragment = feesCollector.interface.getFunction('setSwapFeePercentage');

      const data = feesCollector.interface.encodeFunctionData(functionFragment, [updatedSwapFeePercentage]);
      const eta = moment().add(6, 'days').unix();

      await expect(timelock.connect(admin).queueTransaction(feesCollector.address, '0', 0, data, eta)).to.not.be
        .reverted;
    });
    it('reverts queuing transaction when sender is not admin', async () => {
      const updatedSwapFeePercentage = bn(20e16);
      const functionFragment = feesCollector.interface.getFunction('setSwapFeePercentage');

      const data = feesCollector.interface.encodeFunctionData(functionFragment, [updatedSwapFeePercentage]);
      const eta = moment().add(6, 'days').unix();
      await expect(
        timelock.connect(user).queueTransaction(feesCollector.address, '0', 0, data, eta)
      ).to.be.revertedWith('Timelock::queueTransaction: Call must come from admin.');
    });

    it('reverts queuing transaction if eta < now + delay', async () => {
      /*
            this is actually calculated based on the current block timestamp, so might not be exactly 'now'
         */
      const updatedSwapFeePercentage = bn(20e16);
      const functionFragment = feesCollector.interface.getFunction('setSwapFeePercentage');

      const data = feesCollector.interface.encodeFunctionData(functionFragment, [updatedSwapFeePercentage]);
      // we set the eta lower than the timelock delay
      const eta = moment().add(timelockDelay, 'second').subtract(100, 'seconds').unix();
      await expect(
        timelock.connect(admin).queueTransaction(feesCollector.address, '0', 0, data, eta)
      ).to.be.revertedWith('Timelock::queueTransaction: Estimated execution block must satisfy delay.');
    });

    it('executes queued transaction if eta has been crossed within the grace period', async () => {
      await authorizer
        .connect(admin)
        .grantRoles([await actionId(feesCollector, 'setSwapFeePercentage')], timelock.address);

      const updatedSwapFeePercentage = bn(20e16);
      const functionFragment = feesCollector.interface.getFunction('setSwapFeePercentage');

      const data = feesCollector.interface.encodeFunctionData(functionFragment, [updatedSwapFeePercentage]);
      const eta = moment().add(6, 'days').unix();
      await timelock.connect(admin).queueTransaction(feesCollector.address, '0', 0, data, eta);

      // advance 6 days and a bit
      await advanceTime(518500);
      //
      await expect(timelock.connect(admin).executeTransaction(feesCollector.address, '0', 0, data, eta)).to.not.be
        .reverted;
      expect(await feesCollector.getSwapFeePercentage()).to.equal(updatedSwapFeePercentage);
    });

    it('reverts executed transaction if eta has not been crossed', async () => {
      await authorizer
        .connect(admin)
        .grantRoles([await actionId(feesCollector, 'setSwapFeePercentage')], timelock.address);

      const updatedSwapFeePercentage = bn(20e16);
      const functionFragment = feesCollector.interface.getFunction('setSwapFeePercentage');

      const data = feesCollector.interface.encodeFunctionData(functionFragment, [updatedSwapFeePercentage]);
      const eta = moment().add(6, 'days').unix();
      await timelock.connect(admin).queueTransaction(feesCollector.address, '0', 0, data, eta);

      // advance less then 6 days
      await advanceTime(517000);
      //
      await expect(
        timelock.connect(admin).executeTransaction(feesCollector.address, '0', 0, data, eta)
      ).to.be.revertedWith("Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
    });

    it('reverts executed transaction if transaction is stale', async () => {
      /*
            given the eta has passed, if the transaction is not executed within the grace period, the transaction
            is considered stale and should not execute anymore.
            The grace period is hardcoded to 14days
         */
      await authorizer
        .connect(admin)
        .grantRoles([await actionId(feesCollector, 'setSwapFeePercentage')], timelock.address);

      const updatedSwapFeePercentage = bn(20e16);
      const functionFragment = feesCollector.interface.getFunction('setSwapFeePercentage');

      const data = feesCollector.interface.encodeFunctionData(functionFragment, [updatedSwapFeePercentage]);
      const eta = moment().add(6, 'days').unix();
      await timelock.connect(admin).queueTransaction(feesCollector.address, '0', 0, data, eta);

      // advance eta + grace period plus a little
      await advanceTime((6 + 14) * 86400 + 1);
      //
      await expect(
        timelock.connect(admin).executeTransaction(feesCollector.address, '0', 0, data, eta)
      ).to.be.revertedWith('Timelock::executeTransaction: Transaction is stale.');
    });

    context('timelock is default admin', () => {
      beforeEach('grant default admin to timelock', async () => {
        // await authorizer.connect(admin).grantRoles([defaultAdminRole], timelock.address);
        const defaultAdminRole = await authorizer.DEFAULT_ADMIN_ROLE();
        await authorizer.connect(admin).grantRoles([defaultAdminRole], timelock.address);
        // revoke defaultAdmin from current admin
        await authorizer.connect(admin).revokeRoles([defaultAdminRole], admin.address);
      });

      it('initial admin cannot grant roles', async () => {
        await expect(
          authorizer
            .connect(admin)
            .grantRoles([await actionId(feesCollector, 'setSwapFeePercentage')], timelock.address)
        ).to.be.revertedWith('BAL#422');
      });

      it('grants role after eta', async () => {
        const eta = moment().add(6, 'days').unix();

        const role = await actionId(feesCollector, 'setSwapFeePercentage');
        const functionFragment = authorizer.interface.getFunction('grantRoles');
        const data = feesCollector.interface.encodeFunctionData(functionFragment, [[role], timelock.address]);

        // make sure we dont have the role in the first place
        expect(await authorizer.canPerform(role, timelock.address, ZERO_ADDRESS)).to.be.false;

        await timelock.connect(admin).queueTransaction(authorizer.address, '0', 0, data, eta);

        // advance 6 days and a bit
        await advanceTime(518500);
        //
        await expect(timelock.connect(admin).executeTransaction(authorizer.address, '0', 0, data, eta)).to.not.be
          .reverted;

        expect(await authorizer.canPerform(role, timelock.address, ZERO_ADDRESS)).to.be.true;

        /*
          lets see if we can change the swap fee now just to make sure!
          First we need to set the eta forward, cause the blockchain time moved a good 6 days
         */

        const etaSwapFeeChange = moment()
          .add(7 + 6, 'days')
          .unix();
        const updatedSwapFeePercentage = bn(20e16);
        const swapFeefunctionFragment = feesCollector.interface.getFunction('setSwapFeePercentage');

        const swapFeeData = feesCollector.interface.encodeFunctionData(swapFeefunctionFragment, [
          updatedSwapFeePercentage,
        ]);

        await timelock.connect(admin).queueTransaction(feesCollector.address, '0', 0, swapFeeData, etaSwapFeeChange);

        await advanceTime(7 * 86400);

        await timelock.connect(admin).executeTransaction(feesCollector.address, '0', 0, swapFeeData, etaSwapFeeChange);

        expect(await feesCollector.getSwapFeePercentage()).to.equal(updatedSwapFeePercentage);
      });
    });
  });
});
