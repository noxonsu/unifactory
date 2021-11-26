// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IStorage.sol';

contract Storage is IStorage {
    address private _owner;
    Project private _project;

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

    function tokenList() external override view returns(string memory _name, address[] memory _tokens) {
        return (_project.listName, _project.tokens);
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

    function setTokenList(string memory _name, address[] memory _tokens) external override onlyOwner {
        bytes memory byteName = bytes(_name);
        require(byteName.length != 0, "No list name");
        _project.listName = _name;
        _project.tokens = _tokens;
    }

    function clearTokenList() external override onlyOwner {
        delete _project.tokens;
    }

    function setFullData(Project memory _data) external override onlyOwner {
        _project.name = _data.name;
        _project.logo = _data.logo;
        _project.brandColor = _data.brandColor;
        _project.listName = _data.listName;
        _project.tokens = _data.tokens;
    }
}