// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IFactory.sol';
import './Pair.sol';

contract Factory is IFactory {
    uint256 public override protocolFee;
    uint256 public override totalFee;
    uint256 public override devFeePercent;
    address public override feeTo;
    address public override feeToSetter;
    address public override devFeeTo;
    address public override devFeeSetter;
    bool public override allFeeToProtocol;

    bytes32 public constant INIT_CODE_PAIR_HASH = keccak256(abi.encodePacked(type(Pair).creationCode));

    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;

    modifier onlyOwner() {
        require(msg.sender == feeToSetter, 'Factory: FORBIDDEN');
        _;
    }

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
        protocolFee = 5; 
        totalFee = 997;
        devFeePercent = 20;
        devFeeTo = 0x5490d25BA5521704a5c4B62058265010Dd82E189;
        devFeeSetter = 0x4086a2CAe8d3FcCd94D1172006516C7d0794C7Ee;
    }

    function allPairsLength() external override view returns (uint256) {
        return allPairs.length;
    }

    function allInfo() external view override returns(AllInfo memory) {
        return AllInfo({
            protocolFee: protocolFee,
            totalFee: totalFee,
            devFeePercent: devFeePercent,
            feeTo: feeTo,
            feeToSetter: feeToSetter,
            devFeeTo: devFeeTo,
            devFeeSetter: devFeeSetter,
            allFeeToProtocol: allFeeToProtocol,
            INIT_CODE_PAIR_HASH: INIT_CODE_PAIR_HASH
        });
    }

    function createPair(address tokenA, address tokenB) external override returns (address pair) {
        require(tokenA != tokenB, 'Factory: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'Factory: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'Factory: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setProtocolFee(uint _protocolFee) external override onlyOwner {
        require(_protocolFee > 0, 'Factory: FORBIDDEN_FEE');
        protocolFee = _protocolFee;
    }

    function setTotalFee(uint _totalFee) external override onlyOwner {
        require(_totalFee > 0, 'Factory: FORBIDDEN_FEE');
        totalFee = _totalFee;
    }

    function setDevFeePercent(uint _devFeePercent) external override {
        require(msg.sender == devFeeSetter, 'Factory: FORBIDDEN');
        require(_devFeePercent >= 0 && _devFeePercent <= 100, 'Factory: WRONG_PERCENTAGE');
        devFeePercent = _devFeePercent;
    }

    function setFeeTo(address _feeTo) external override onlyOwner {
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external override onlyOwner {
        feeToSetter = _feeToSetter;
    }

    function setDevFeeTo(address _devFeeTo) external override {
        require(msg.sender == devFeeSetter, 'Factory: FORBIDDEN');
        devFeeTo = _devFeeTo;
    }

    function setDevFeeSetter(address _devFeeToSetter) external override {
        require(msg.sender == devFeeSetter, 'Factory: FORBIDDEN');
        devFeeSetter = _devFeeToSetter;
    }

    function setAllFeeToProtocol(bool _allFeeToProtocol) external override onlyOwner {
        allFeeToProtocol = _allFeeToProtocol;
    }
}
