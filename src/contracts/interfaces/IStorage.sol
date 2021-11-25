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
        string[] tokens;
    }

    function owner() external view returns(address);
    function project() external view returns(Project memory);
    function tokenList() external view returns(TokenList memory);
    function setOwner(address) external;
    function setProjectName(string memory) external;
    function setLogoUrl(string memory) external;
    function setBrandColor(string memory) external;
    function setTokenList(TokenList memory _list) external;
}