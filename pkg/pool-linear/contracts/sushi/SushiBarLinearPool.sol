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

import "../interfaces/ISushiBar.sol";

import "../LinearPool.sol";

contract SushiBarLinearPool is LinearPool {
    IERC20 private immutable _mainToken;
    IERC20 private immutable _wrappedToken;

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
        _mainToken = mainToken;
        _wrappedToken = wrappedToken;

        _require(address(mainToken) == ISushiBar(address(wrappedToken)).vestingToken(), Errors.TOKENS_MISMATCH);
    }

    //_getWrappedTokenRate must always return the rate scaled to 18 decimal places
    function _getWrappedTokenRate() internal view override returns (uint256) {
        return (_mainToken.balanceOf(address(_wrappedToken)) * 10**18) / _wrappedToken.totalSupply();
    }
}
