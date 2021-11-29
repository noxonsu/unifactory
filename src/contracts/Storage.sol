// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IStorage.sol';

contract Storage is IStorage {
    address private _owner;
    Project private _project;
    TokenList[] private _tokenLists;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Owner: FORBIDDEN");
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

    function tokenList(string memory _name) external override view returns(string memory _listData) {
        for(uint256 i; i < _tokenLists.length; i++) {
            if (keccak256(abi.encodePacked(_tokenLists[i].name)) == keccak256(abi.encodePacked(_name))) {
                return _tokenLists[i].data;
            }
        }
    }

    function tokenLists() external override view returns(string[] memory) {
        string[] memory lists = new string[](_tokenLists.length);
        for(uint256 i; i < _tokenLists.length; i++) {
            lists[i] = _tokenLists[i].data;
        }
        return lists;
    }

    function setOwner(address owner_) external override onlyOwner {
        require(owner_ != address(0), "Zero address");
        _owner = owner_;
    }

    function setProjectName(string memory _name) external override onlyOwner {
        _project.name = _name;
    }

    function setLogoUrl(string memory _logo) external override onlyOwner {
        _project.logo = _logo;
    }

    function setBrandColor(string memory _color) external override onlyOwner {
        _project.brandColor = _color;
    }

    function addTokenList(string memory _name, string memory _data) external override onlyOwner {
        bytes memory byteName = bytes(_name);
        require(byteName.length != 0, "No name");
        bool exist;
        for(uint256 i; i < _tokenLists.length; i++) {
            if (keccak256(abi.encodePacked(_tokenLists[i].name)) == keccak256(abi.encodePacked(_name))) {
                _tokenLists[i].name = _name;
                _tokenLists[i].data = _data;
                exist = true;
            }
        }
        if (!exist) _tokenLists.push(TokenList({name: _name, data: _data}));
    }

    function removeTokenList(string memory _name) external override onlyOwner {
        bytes memory byteName = bytes(_name);
        require(byteName.length != 0, "No name");
        bool arrayOffset;
        for(uint256 i; i < _tokenLists.length - 1; i++) {
            if (keccak256(abi.encodePacked(_tokenLists[i].name)) == keccak256(abi.encodePacked(_name))) {
                arrayOffset = true;
            }
            if (arrayOffset) _tokenLists[i] = _tokenLists[i + 1];
        }
        if (arrayOffset) _tokenLists.pop();
    }

    function clearTokenLists() external override onlyOwner {
        delete _tokenLists;
    }

    function setFullData(Project memory _newData) external override onlyOwner {
        // use existed functions to set this info
        _project.name = _newData.name;
        _project.logo = _newData.logo;
        _project.brandColor = _newData.brandColor;
    }
}