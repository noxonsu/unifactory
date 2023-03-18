// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IFactory {
    struct AllInfo {
        uint[30] POSSIBLE_PROTOCOL_PERCENT;
        uint MAX_TOTAL_FEE_PERCENT;
        uint MAX_PROTOCOL_FEE_PERCENT;
        uint totalSwaps;
        uint protocolFee;
        uint totalFee;
        uint OnoutFeePercent;
        address feeTo;
        address feeToSetter;
        address OnoutFeeTo;
        address OnoutFeeSetter;
        bool allFeeToProtocol;
        bytes32 INIT_CODE_PAIR_HASH;
    }

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function MAX_TOTAL_FEE_PERCENT() external view returns(uint);
    function MAX_PROTOCOL_FEE_PERCENT() external view returns(uint);
    function totalSwaps() external view returns(uint);
    function protocolFee() external view returns(uint);
    function totalFee() external view returns(uint);
    function OnoutFeePercent() external view returns(uint);
    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
    function OnoutFeeTo() external view returns(address);
    function OnoutFeeSetter() external view returns(address);
    function allFeeToProtocol() external view returns(bool);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);
    function allInfo() external view returns (AllInfo memory);

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setOnoutFeePercent(uint) external;
    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
    function setOnoutFeeTo(address) external;
    function setOnoutFeeSetter(address) external;
    function setAllFeeToProtocol(bool) external;
    function setMainFees(uint _totalFee, uint _protocolFee) external;
    function setTotalFee(uint) external;
    function setProtocolFee(uint) external;
    function increaseNumberOfSwaps(address token0, address token1) external;
}
