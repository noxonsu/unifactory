// SPDX-License-Identifier: MIT
pragma solidity =0.7.5;

import './interfaces/IUniswapV2Factory.sol';
import './Pair.sol';

contract Factory is IUniswapV2Factory {
    uint256 public override protocolFeeDenominator = 3000;
    uint256 public override totalFee = 996;
    address public override feeTo;
    address public override feeToSetter;
    bytes32 public constant INIT_CODE_PAIR_HASH = keccak256(abi.encodePacked(type(Pair).creationCode));
    bool public override allFeeToProtocol;

    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;

    modifier onlyOwner() {
        require(msg.sender == feeToSetter, 'Factory: FORBIDDEN');
        _;
    }

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external override view returns (uint256) {
        return allPairs.length;
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

    function setFeeTo(address _feeTo) external override onlyOwner {
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external override onlyOwner {
        feeToSetter = _feeToSetter;
    }

    function setAllFeeToProtocol(bool _allFeeToProtocol) external override onlyOwner {
        allFeeToProtocol = _allFeeToProtocol;
    }

    // set protocol fee denominator to change fee in _mintFee() function of the pair
    function setProtocolFee(uint _protocolFeeDenominator) external override onlyOwner {
        require(_protocolFeeDenominator > 0, 'Factory: FORBIDDEN_FEE');
        protocolFeeDenominator = _protocolFeeDenominator;
    }

    // set total fee function to change fees in getAmountsOut function
    function changeTotalFee(uint _totalFee) external override onlyOwner {
        require(_totalFee > 0, 'Factory: FORBIDDEN_FEE');
        totalFee = _totalFee;
    }
}
