// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWETH} from "./interfaces/IWETH.sol";

contract Vault {
    using SafeERC20 for IERC20;
    address public immutable WETH;

    mapping(address => mapping(address => uint256)) public balances;

    event Deposit (
        address indexed user,
        address indexed asset,
        uint256 amount
    );

    event Withdraw (
        address indexed user,
        address indexed asset,
        uint256 amount
    );

    event WrapETHToWETH(
        address indexed user,
        uint256 amount
    );

    event UnwrapWETHToETH(
        address indexed user,
        uint256 amount
    );

    constructor(address _WETH) {
        WETH = _WETH;
    }

    function depositETH() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender][address(0)] += msg.value;

        emit Deposit(msg.sender, address(0), msg.value);
    }

    function withdrawETH(uint256 _amount) external {
        require(_amount > 0, "Withdraw amount must be greater than 0");
        require(balances[msg.sender][address(0)] >= _amount, "Insufficient ETH balance");
        balances[msg.sender][address(0)] -= _amount;
        payable(msg.sender).transfer(_amount);

        emit Withdraw(msg.sender, address(0), _amount);
    }

    function getETHBalance() external view returns (uint256) {
        return balances[msg.sender][address(0)];
    }

    function depositERC20(address _asset, uint256 _amount ) external {
        require(_amount > 0, "Deposit amount must be greater than 0");
        // check allowance of msg.sender
        require(IERC20(_asset).allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");
        // transfer tokens from msg.sender to this contract
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
        balances[msg.sender][_asset] += _amount;

        emit Deposit(msg.sender, _asset, _amount);
    }

    function withdrawERC20(address _asset, uint256 _amount) external {
        require(_amount > 0, "Withdraw amount must be greater than 0");
        require(balances[msg.sender][_asset] >= _amount, "Insufficient balance");
        IERC20(_asset).safeTransfer(msg.sender, _amount);
        balances[msg.sender][_asset] -= _amount;

        emit Withdraw(msg.sender, _asset, _amount);
    }

    function getAssetBalance(address token) external view returns (uint256) {
        return balances[msg.sender][token];
    }

    function wrapETHToWETH(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than zero");
        require(balances[msg.sender][address(0)] >= _amount, "Insufficient ETH balance");

        balances[msg.sender][address(0)] -= _amount;
        IWETH(WETH).deposit{value: _amount}();
        balances[msg.sender][WETH] += _amount;

        emit WrapETHToWETH(msg.sender, _amount);
    }

    function unwrapWETHToETH(uint256 _amount) external {
        require(_amount >= 0, "Invalid amount");

        // check if the user has WETH balance in vault
        require(balances[msg.sender][WETH] >= _amount, "Insufficient WETH balance");
        // decrease the weth amount
        balances[msg.sender][WETH] -= _amount;
        // withdraw weth into vault
        IWETH(WETH).withdraw(_amount);
        // increase the eth balance
        balances[msg.sender][address(0)] += _amount;

        emit UnwrapWETHToETH(msg.sender, _amount);
    }
}
