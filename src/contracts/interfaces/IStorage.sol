// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStorage {
    struct Project {
        string name;
        string logo;
        string brandColor;
        string listName;
        address[] tokens;
    }

    struct TokenList {
        string name;
        address[] tokens;
    }

    function owner() external view returns(address);
    function project() external view returns(Project memory);
    function tokenList() external view returns(string memory _name, address[] memory _tokens);
    function setOwner(address) external;
    function setProjectName(string memory) external;
    function setLogoUrl(string memory) external;
    function setBrandColor(string memory) external;
    function setTokenList(string memory _name, address[] memory _tokens) external;
    function clearTokenList() external;
    function setFullData(Project memory) external;
}