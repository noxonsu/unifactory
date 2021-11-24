// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IStorage.sol';

contract Storage is IStorage {
    address private _owner;
    Project private _project;

    // TODO: ability to add/remove and change any token list
    // problems with mapping: how to get all existed lists,
    // if we have to know mapping lenght and every key
    // uint256 private _tokenListLength;
    // string[] private _tokenListNames;
    // TokenLists private _tokenLists = TokenLists(0, {});
    mapping(string => TokenList) private _tokenLists;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Caller is not the owner");
        _;
    }

    constructor(address owner_) {
        _owner = owner_;
    }

    function owner() external override view returns(address) {
        return _owner;
    }

    function project() external override view returns(Project memory) {
        return _project;
    }

    function list(string memory _listName) external override view returns(TokenList memory) {
        bytes memory byteName = bytes(_listName);
        require(byteName.length != 0, "No list name");
        return _tokenLists[_listName];
    }

    // function tokenLists() external override view returns(TokenList[] memory) {
    //     TokenList[] memory memoryArray = new TokenList[];

    //     for(uint256 i = 0; i < _tokenListLength; i++) {
    //         memoryArray[i] = _tokenLists[]; // how to get all keys
    //     }

    //     return memoryArray;
    // }

    function setOwner(address owner_) external override onlyOwner {
        _owner = owner_;
    }

    function setProjectName(string memory _projectName) external override onlyOwner {
        _project.name = _projectName;
    }

    function setLogoUrl(string memory _logoUrl) external override onlyOwner {
        _project.logo = _logoUrl;
    }

    function setBrandColor(string memory _brandColor) external override onlyOwner {
        _project.brandColor = _brandColor;
    }

    function addTokenList(string memory _name, string[] memory _tokenList) external override onlyOwner {
        _tokenLists[_name] = TokenList(true, _name, _tokenList);
    }

    function removeTokenList(string memory _key) external override onlyOwner {
        require(!_tokenLists[_key].exists, "The list of tokens does not exist");
        delete _tokenLists[_key];
    }

    function addFullData(FullProjectData memory fullData) external override onlyOwner {
        bytes memory byteName = bytes(fullData.name);
        bytes memory byteLogo = bytes(fullData.logo);
        bytes memory byteColor = bytes(fullData.brandColor);

        if (byteName.length != 0) {
            _project.name = fullData.name;
        }
        if (byteLogo.length != 0) {
            _project.logo = fullData.logo;
        }
        if (byteColor.length != 0) {
            _project.brandColor = fullData.brandColor;
        }
        // if (fullData.listName && fullData.tokens) {
        //     _tokenLists[fullData.listName] = TokenList(true, fullData.listName, fullData.tokens);
        // }
    }
}