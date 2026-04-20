// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TeachAgentPayment
 * @dev Handles 0.001 CELO payments for the AI agent on the Celo network.
 */
contract TeachAgentPayment {
    address public owner;
    uint256 public pricePerQuestion = 0.001 ether; // 0.001 CELO
    uint256 public totalQuestions;

    event QuestionPaid(address indexed student, uint256 indexed questionId, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Users call this with 0.001 CELO to pay for a question.
     * The backend listens/verifies the transaction hash.
     */
    function payForQuestion() external payable returns (uint256 questionId) {
        require(msg.value >= pricePerQuestion, "Insufficient payment: must be at least 0.001 CELO");
        
        totalQuestions++;
        questionId = totalQuestions;
        
        emit QuestionPaid(msg.sender, questionId, msg.value);
        
        return questionId;
    }

    /**
     * @dev Allows the owner to withdraw the collected CELO fees.
     */
    function withdraw() external {
        require(msg.sender == owner, "Not authorized");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Update the price per question if CELO price fluctuates.
     */
    function setPrice(uint256 _newPrice) external {
        require(msg.sender == owner, "Not authorized");
        pricePerQuestion = _newPrice;
    }
}