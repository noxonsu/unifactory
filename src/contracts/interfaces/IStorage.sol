// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IStorage {
    struct Data {
        address owner;
        string info;
    }

    struct KeyData {
        string key;
        Data data;
    }

    function getData(string memory _key) external view returns(Data memory);
    function allKeys() external view returns(string[] memory);
    function allKeysData() external view returns(Data[] memory);
    function setKeyData(string memory _key, Data memory _data) external;
    function setKeysData(KeyData[] memory _keysData) external;
    function clearKeyData(string memory _key) external;
    function clearKeysData(string[] memory _keys) external;
}