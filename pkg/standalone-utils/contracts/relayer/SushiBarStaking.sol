// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/Address.sol";
import "@balancer-labs/v2-vault/contracts/interfaces/IVault.sol";

import "../interfaces/IBaseRelayerLibrary.sol";
import "../../../solidity-utils/contracts/openzeppelin/IERC20.sol";
import "../interfaces/ISushiBar.sol";

/**
 * @title SushiBarStaking
 * @notice Allows users to deposit and withdraw tokens to/from a SushiBar contract
 * @dev All functions must be payable so that it can be called as part of a multicall involving ETH
 */
abstract contract SushiBarStaking is IBaseRelayerLibrary {
    using Address for address payable;

    function wrapToken(
        ISushiBar sushiBar,
        address sender,
        address recipient,
        uint256 amount,
        uint256 outputReference
    ) external payable {
        if (_isChainedReference(amount)) {
            amount = _getChainedReferenceValue(amount);
        }

        // The deposit caller is the implicit sender of tokens, so if the goal is for the tokens
        // to be sourced from outside the relayer, we must first pull them here.
        if (sender != address(this)) {
            require(sender == msg.sender, "Incorrect sender");
            _pullToken(sender, sushiBar.vestingToken(), amount);
        }

        //deposit the vesting token into the sushi bar
        sushiBar.vestingToken().approve(address(sushiBar), amount);
        sushiBar.enter(amount);

        //determine the amount of xSUSHI minted for the amount deposited
        uint256 xSushiAmount = sushiBar.balanceOf(address(this));

        //transfer the xSUSHI to the recipient
        sushiBar.transfer(xSushiAmount, recipient);

        if (_isChainedReference(outputReference)) {
            _setChainedReferenceValue(outputReference, xSushiAmount);
        }
    }

    function unwrapToken(
        ISushiBar sushiBar,
        address sender,
        address recipient,
        uint256 amount,
        uint256 outputReference
    ) external payable {
        if (_isChainedReference(amount)) {
            amount = _getChainedReferenceValue(amount);
        }

        // The deposit caller is the implicit sender of tokens, so if the goal is for the tokens
        // to be sourced from outside the relayer, we must first pull them here.
        if (sender != address(this)) {
            require(sender == msg.sender, "Incorrect sender");
            _pullToken(sender, sushiBar, amount);
        }

        //burn the xSUSHI shares and receive SUSHI
        sushiBar.leave(amount);

        //determine the amount of SUSHI returned for the shares burned
        uint256 vestingTokenAmount = sushiBar.vestingToken().balanceOf(address(this));

        //send the SUSHI to the recipient
        sushiBar.vestingToken().transfer(recipient, vestingTokenAmount);

        if (_isChainedReference(outputReference)) {
            _setChainedReferenceValue(outputReference, vestingTokenAmount);
        }
    }
}
