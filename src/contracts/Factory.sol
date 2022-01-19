// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IFactory.sol';
import './Pair.sol';

contract Factory is IFactory {
    using SafeMath for uint;

    uint[30] public POSSIBLE_PROTOCOL_PERCENT = [10000, 5000, 3300, 2500, 2000, 1600, 1400, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1];
    uint public override constant MAX_TOTAL_FEE_PERCENT = 1_000;
    uint public override constant MAX_PROTOCOL_FEE_PERCENT = 10_000;
    uint public override totalSwaps;
    uint public override protocolFee;
    uint public override totalFee;
    uint public override devFeePercent;
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

    constructor(address _feeToSetter, address _devFeeSetter) {
        feeToSetter = _feeToSetter;
        devFeeSetter = _devFeeSetter;
        totalFee = 3;
        protocolFee = 2000;
        devFeePercent = 20;
    }

    function allPairsLength() external view override returns (uint) {
        return allPairs.length;
    }

    function allInfo() external view override returns(AllInfo memory) {
        return AllInfo({
            totalSwaps: totalSwaps,
            protocolFee: protocolFee,
            totalFee: totalFee,
            devFeePercent: devFeePercent,
            feeTo: feeTo,
            feeToSetter: feeToSetter,
            devFeeTo: devFeeTo,
            devFeeSetter: devFeeSetter,
            allFeeToProtocol: allFeeToProtocol,
            POSSIBLE_PROTOCOL_PERCENT: POSSIBLE_PROTOCOL_PERCENT,
            MAX_TOTAL_FEE_PERCENT: MAX_TOTAL_FEE_PERCENT,
            MAX_PROTOCOL_FEE_PERCENT: MAX_PROTOCOL_FEE_PERCENT,
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

    function setMainFees(uint _totalFee, uint _protocolFee) external override onlyOwner {
        _setTotalFee(_totalFee);
        _setProtocolFee(_protocolFee);
        require(totalFee == _totalFee && protocolFee == _protocolFee, 'Factory: CANNOT_CHANGE');
    }

    function setTotalFee(uint _totalFee) external override onlyOwner {
        _setTotalFee(_totalFee);
    }

    function setProtocolFee(uint _protocolFee) external override onlyOwner {
        _setProtocolFee(_protocolFee);
    }

    function increaseNumberOfSwaps(address token0, address token1) external override {
        require(msg.sender == getPair[token0][token1], 'Factory: FORBIDDEN');
        if (totalSwaps < type(uint).max) totalSwaps += 1;
    }

    function _setTotalFee(uint _totalFee) private {
        require(_totalFee >= 0 && _totalFee <= MAX_TOTAL_FEE_PERCENT - 1, 'Factory: FORBIDDEN_FEE');
        totalFee = _totalFee;
    }

    function _setProtocolFee(uint _protocolFee) private {
        require(_protocolFee >= 0 && _protocolFee <= MAX_PROTOCOL_FEE_PERCENT, 'Factory: FORBIDDEN_FEE');
        if (_protocolFee != 0) {
            bool allowed;
            for(uint x; x < POSSIBLE_PROTOCOL_PERCENT.length; x++) {
                if (_protocolFee == POSSIBLE_PROTOCOL_PERCENT[x]) {
                    allowed = true;
                    break;
                }
            }
            if (!allowed) revert('Factory: FORBIDDEN_FEE');
        }
        protocolFee = _protocolFee;
    }
}
