// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./EIP712MetaTransaction.sol";

contract GasSwap is EIP712MetaTransaction("GasSwap", "3"), ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public authorizedTarget;

    struct Transformation {
        uint32 _uint32;
        bytes _bytes;
    }

    constructor() {
        owner = msg.sender;
        authorizedTarget = 0xDef1C0ded9bec7F1a1670819833240f027b25EfF;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    receive() external payable {
        require(isContract(msgSender()), "REVERT_EOA_DEPOSIT");
    }

    function changeOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function changeTarget(address newTarget) external onlyOwner {
        require(isContract(newTarget), "NO_CONTRACT_AT_ADDRESS");
        authorizedTarget = newTarget;
    }

    function withdrawToken(IERC20 token, uint256 amount) external {
        token.safeTransfer(owner, amount);
    }

    function withdrawETH(uint256 amount) external {
        payable(owner).transfer(amount);
    }

    // Swaps ERC20->MATIC tokens held by this contract using a 0x-API quote.
    function fillQuote(address spender, bytes calldata swapCallData) external nonReentrant returns (uint256)
    {
        (address inputToken,address outputToken,uint256 inputAmount,uint256 minOutputAmount,) = abi.decode(swapCallData[4:], (address,address,uint256,uint256,Transformation[]));
        require(outputToken == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, "INVALID_OUTPUT_TOKEN");
        IERC20 sellToken = IERC20(inputToken);
        sellToken.safeTransferFrom(msgSender(), address(this), inputAmount);
        sellToken.safeApprove(spender, inputAmount);
        (bool success, bytes memory res) = authorizedTarget.call(swapCallData);
        require(success, string(concat(bytes("SWAP_FAILED: "), bytes(getRevertMsg(res)))));
        uint256 outputTokenAmount = abi.decode(res, (uint256));
        require(outputTokenAmount >= minOutputAmount, "SWAP_VALUE_MISMATCH");
        sellToken.safeApprove(spender, uint256(0));
        payable(msgSender()).transfer(outputTokenAmount);
        return outputTokenAmount;
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function concat(bytes memory a, bytes memory b) internal pure returns (bytes memory) {
        return abi.encodePacked(a, b);
    }

    function getRevertMsg(bytes memory _returnData) internal pure returns (string memory) {
        if (_returnData.length < 68)
            return "Transaction reverted silently";

        assembly {
            _returnData := add(_returnData, 0x04)
        }

        return abi.decode(_returnData, (string));
    }
}
