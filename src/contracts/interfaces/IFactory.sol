// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IFactory {
    struct AllInfo {
        uint protocolFee;
        uint totalFee;
        uint devFeePercent;
        address feeTo;
        address feeToSetter;
        address devFeeTo;
        address devFeeSetter;
        bool allFeeToProtocol;
        bytes32 INIT_CODE_PAIR_HASH;
    }

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function protocolFee() external view returns(uint);
    function totalFee() external view returns(uint);
    function devFeePercent() external view returns(uint);
    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
    function devFeeTo() external view returns(address);
    function devFeeSetter() external view returns(address);
    function allFeeToProtocol() external view returns(bool);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);
    function allInfo() external view returns (AllInfo memory);

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setDevFeePercent(uint) external;
    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
    function setDevFeeTo(address) external;
    function setDevFeeSetter(address) external;
    function setAllFeeToProtocol(bool) external;
}
