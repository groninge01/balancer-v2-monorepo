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

import "../interfaces/IYearnTokenVault.sol";

import "../LinearPool.sol";

contract YearnLinearPool is LinearPool {
    IYearnTokenVault private immutable _tokenVault;

    constructor(
        IVault vault,
        string memory name,
        string memory symbol,
        IERC20 mainToken,
        IERC20 wrappedToken,
        uint256 upperTarget,
        uint256 swapFeePercentage,
        uint256 pauseWindowDuration,
        uint256 bufferPeriodDuration,
        address owner
    )
        LinearPool(
            vault,
            name,
            symbol,
            mainToken,
            wrappedToken,
            upperTarget,
            swapFeePercentage,
            pauseWindowDuration,
            bufferPeriodDuration,
            owner
        )
    {
        _tokenVault = IYearnTokenVault(address(wrappedToken));
        _require(address(mainToken) == IYearnTokenVault(address(wrappedToken)).token(), Errors.TOKENS_MISMATCH);
    }

    function _getWrappedTokenRate() internal view override returns (uint256) {
        // The LinearPool implementation manages decimal scaling, so simply returning pricePerShare is appropriate
        return _tokenVault.pricePerShare();
    }
}
