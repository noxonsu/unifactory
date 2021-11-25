// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IStorage.sol';

contract Storage is IStorage {
    address private _owner;
    Project private _project;
    TokenList private _tokenList;

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

    function tokenList() external override view returns(TokenList memory) {
        return _tokenList;
    }

    function setOwner(address owner_) external override onlyOwner {
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

    function setTokenList(TokenList memory _list) external override onlyOwner {
        bytes memory byteName = bytes(_list.name);
        require(byteName.length != 0, "No name");

        _tokenList = _list;
    }
}