// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStorage {
    struct Project {
        string name;
        string logo;
        string brandColor;
    }

    struct TokenList {
        string name;
        string data;
    }

    function owner() external view returns(address);
    function project() external view returns(Project memory);
    function tokenList(string memory) external view returns(string memory);

    function tokenLists() external view returns(string[] memory);
    function addTokenList(string memory _name, string memory _data) external;
    function removeTokenList(string memory) external;

    function setOwner(address) external;
    function setProjectName(string memory) external;
    function setLogoUrl(string memory) external;
    function setBrandColor(string memory) external;
    function clearTokenLists() external;
    function setFullData(Project memory) external;
}