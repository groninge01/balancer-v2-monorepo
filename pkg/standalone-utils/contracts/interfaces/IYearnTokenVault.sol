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

import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/IERC20.sol";

interface IYearnTokenVault is IERC20 {
    /**
     * @notice Withdraws the calling account's tokens from this Vault, redeeming amount `_shares` for an appropriate amount of tokens. See note on `setWithdrawalQueue` for further details of withdrawal ordering and behavior.
     * @param maxShares How many shares to try and redeem for tokens, defaults to all.
     * @param recipient The address to issue the shares in this Vault to. Defaults to the caller's address.
     * @return redeemed: The quantity of tokens redeemed for `_shares`.
     **/
    function withdraw(
        uint256 maxShares,
        address recipient
    ) external returns (uint256);
}
