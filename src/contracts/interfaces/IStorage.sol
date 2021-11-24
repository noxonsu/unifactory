// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStorage {
    struct Project {
        string name;
        string logo;
        string brandColor;
    }

    struct TokenList {
        bool exists;
        string name;
        string[] tokens;
    }

    struct TokenLists {
        uint256 size;
        mapping(string => TokenList) _tokenLists;
    }

    struct FullProjectData {
        string name;
        string logo;
        string brandColor;
        string listName;
        string[] tokens;
    }

    function owner() external view returns(address);
    function project() external view returns(Project memory);
    function list(string memory) external view returns(TokenList memory);
    // function tokenLists() external view returns(TokenList[] memory);

    function setOwner(address) external;
    function setProjectName(string memory) external;
    function setLogoUrl(string memory) external;
    function setBrandColor(string memory) external;
    function addTokenList(string memory _name, string[] memory _tokenList) external;
    function removeTokenList(string memory) external;
    function addFullData(FullProjectData memory) external;
}