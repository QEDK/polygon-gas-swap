// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

// A partial ERC20 interface.
interface IERC20 {
    function balanceOf(address owner) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract GasSwap  {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    // Payable fallback to allow this contract to receive protocol fee refunds.
    receive() external payable {}

    // Transfer tokens held by this contrat to the sender/owner.
    function withdrawToken(IERC20 token, uint256 amount)
        external
        onlyOwner
    {
        require(token.transfer(msg.sender, amount));
    }

    // Transfer ETH held by this contrat to the sender/owner.
    function withdrawETH(uint256 amount)
        external
        onlyOwner
    {
        msg.sender.transfer(amount);
    }

    // Transfer ETH into this contract and wrap it into WETH.
    receive() external payable;

    // Swaps ERC20->MATIC tokens held by this contract using a 0x-API quote.
    function fillQuote(
        // Address of token being sold
        IERC20 sellToken,
        // Amount of token being sold
        uint256 sellAmount,
        // Amount of MATIC being bought
        uint256 buyAmount,
        // Address sending token address for swap
        address payable depositor,
        // Address that needs approval to spend our tokens
        address spender,
        address payable swapTarget,
        bytes calldata swapCallData
    )
        onlyOwner
        external
    {
        require(sender.balance < 1000000000000000000, "SENDER_BALANCE_EXCEEDS_LIMIT");
        require(sellToken.transferFrom(depositor, address(this), amount), "TRANSFER_FAILED");
        // required for some tokens like USDT
        require(sellToken.approve(spender, uint256(0)), "APPROVAL_WIPE_FAILED");
        require(sellToken.approve(spender, amount), "REAPPROVAL_FAILED");

        (bool success,) = swapTarget.call{value: msg.value}(swapCallData);
        require(success, 'SWAP_CALL_FAILED');
        depositor.transfer(buyAmount);
    }
}
