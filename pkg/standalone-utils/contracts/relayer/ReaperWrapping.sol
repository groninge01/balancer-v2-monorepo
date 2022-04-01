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
import "../interfaces/IReaperTokenVault.sol";

/**
 * @title ReaperWrapping
 * @notice Allows users to wrap and unwrap Reapers's rfTokens into their underlying main tokens
 * @dev All functions must be payable so that it can be called as part of a multicall involving ETH
 */
abstract contract ReaperWrapping is IBaseRelayerLibrary {
    using Address for address payable;

    function unwrapReaperVaultToken(
        IReaperTokenVault vaultToken,
        address sender,
        address recipient,
        uint256 amount,
        uint256 outputReference
    ) external payable {
        if (_isChainedReference(amount)) {
            amount = _getChainedReferenceValue(amount);
        }

        // The unwrap caller is the implicit sender of tokens, so if the goal is for the tokens
        // to be sourced from outside the relayer, we must first pull them here.
        if (sender != address(this)) {
            require(sender == msg.sender, "Incorrect sender");
            _pullToken(sender, vaultToken, amount);
        }

        IERC20 underlyingToken = vaultToken.token();
        //determine the amount of underlying token that is present on the batch relayer prior to leaving.
        //This should always be 0, but we want to be certain
        uint256 tokenAmountBefore = underlyingToken.balanceOf(address(this));

        //burn the rf shares and receive the underlying token
        vaultToken.withdraw(amount);

        //determine the amount of underlying returned for the shares burned
        uint256 withdrawnAmount = underlyingToken.balanceOf(address(this)) - tokenAmountBefore;

        //send the shares to the recipient
        underlyingToken.transfer(recipient, withdrawnAmount);

        if (_isChainedReference(outputReference)) {
            _setChainedReferenceValue(outputReference, withdrawnAmount);
        }
    }

    function wrapReaperVaultToken(
        IReaperTokenVault vaultToken,
        address sender,
        address recipient,
        uint256 amount,
        uint256 outputReference
    ) external payable {
        if (_isChainedReference(amount)) {
            amount = _getChainedReferenceValue(amount);
        }

        IERC20 underlyingToken = vaultToken.token();
        // The wrap caller is the implicit sender of tokens, so if the goal is for the tokens
        // to be sourced from outside the relayer, we must first pull them here.
        if (sender != address(this)) {
            require(sender == msg.sender, "Incorrect sender");
            _pullToken(sender, underlyingToken, amount);
        }

        //approve the vault token to spend the amount specified in the wrap
        underlyingToken.approve(address(vaultToken), amount);

        //determine the amount of shares that are present on the batch relayer prior to leaving.
        //This should always be 0, but we want to be certain
        uint256 sharesBefore = vaultToken.balanceOf(address(this));

        //deposit the tokens into the vault
        vaultToken.deposit(amount);

        //determine the amount of shares gained from depositing
        uint256 sharesGained = vaultToken.balanceOf(address(this)) - sharesBefore;

        //send the shares to the recipient
        vaultToken.transfer(recipient, sharesGained);

        if (_isChainedReference(outputReference)) {
            _setChainedReferenceValue(outputReference, sharesGained);
        }
    }
}
