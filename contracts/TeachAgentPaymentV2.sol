// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TeachAgentPaymentV2
 * @dev Handles 0.001 CELO (or cUSD) payments for the TeachAgent AI agent on Celo.
 *
 * Hardening over V1:
 *  - transferOwnership(): rotate the owner if a key is ever compromised
 *  - withdrawToken(): rescue ERC-20s (e.g. cUSD from MiniPay) — V1 had no way
 *    to recover ERC-20 tokens sent to the contract
 *  - ReentrancyGuard on withdrawals
 *  - Two-step ownership transfer to avoid sending control to a wrong address
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TeachAgentPaymentV2 {
    address public owner;
    address public pendingOwner;
    uint256 public pricePerQuestion = 0.001 ether; // 0.001 CELO
    uint256 public totalQuestions;

    bool private _locked;

    event QuestionPaid(address indexed student, uint256 indexed questionId, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event TokenWithdraw(address indexed token, address indexed to, uint256 amount);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @dev Users call this with >= 0.001 CELO to pay for a question.
    function payForQuestion() external payable returns (uint256 questionId) {
        require(msg.value >= pricePerQuestion, "Insufficient payment: must be at least 0.001 CELO");
        totalQuestions++;
        questionId = totalQuestions;
        emit QuestionPaid(msg.sender, questionId, msg.value);
        return questionId;
    }

    /// @dev Withdraw collected native CELO to the owner.
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
        emit Withdraw(owner, balance);
    }

    /// @dev Withdraw any ERC-20 (e.g. cUSD received via MiniPay) to the owner.
    function withdrawToken(address token) external onlyOwner nonReentrant {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No token balance");
        require(IERC20(token).transfer(owner, balance), "Token transfer failed");
        emit TokenWithdraw(token, owner, balance);
    }

    /// @dev Update the price per question.
    function setPrice(uint256 _newPrice) external onlyOwner {
        emit PriceUpdated(pricePerQuestion, _newPrice);
        pricePerQuestion = _newPrice;
    }

    /// @dev Begin a two-step ownership transfer.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @dev New owner accepts ownership (two-step prevents typos locking the contract).
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
}
