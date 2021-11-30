// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IUniswapV2Factory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function protocolFeeDenominator() external returns(uint);
    function totalFee() external returns(uint);
    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
    function allFeeToProtocol() external view returns(bool);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
    function setAllFeeToProtocol(bool) external;
    function setProtocolFee(uint) external;
    function changeTotalFee(uint) external;
}
