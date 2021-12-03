// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IStorage.sol';

contract Storage is IStorage {
    address private _owner;
    Project private _project;
    TokenList[] private _tokenLists;

    modifier onlyOwner() {
        require(msg.sender == _owner, 'Owner: FORBIDDEN');
        _;
    }

    constructor(address owner_) {
        _owner = owner_;
    }

    function setOwner(address owner_) external override onlyOwner {
        require(owner_ != address(0), 'ZERO_ADDRESS');
        _owner = owner_;
    }

    function setDomain(string memory _domain) external override onlyOwner {
        _setDomain(_domain);
    }

    function setProjectName(string memory _name) external override onlyOwner {
        _setProjectName(_name);
    }

    function setLogoUrl(string memory _logo) external override onlyOwner {
        _setLogoUrl(_logo);
    }

    function setBrandColor(string memory _color) external override onlyOwner {
        _setBrandColor(_color);
    }

    function setFullData(Project memory _data) external override onlyOwner {
        _setDomain(_data.domain);
        _setProjectName(_data.name);
        _setLogoUrl(_data.logo);
        _setBrandColor(_data.brandColor);
    }

    function addTokenList(string memory _name, string memory _data) external override onlyOwner {
        _addTokenList(_name, _data);
    }

    function addTokenLists(TokenList[] memory _lists) external override onlyOwner {
        _addTokenLists(_lists);
    }

    function updateTokenList(
        string memory _oldName,
        string memory _name,
        string memory _data
    ) external override onlyOwner {
        bytes memory byteOldName = bytes(_oldName);
        bytes memory byteName = bytes(_name);
        require(byteOldName.length != 0 || byteName.length != 0, 'NAMES_ARE_REQUIRED');
        for(uint256 x; x < _tokenLists.length; x++) {
            if (keccak256(abi.encodePacked(_tokenLists[x].name)) == keccak256(abi.encodePacked(_oldName))) {
                _tokenLists[x].name = _name;
                _tokenLists[x].data = _data;
                break;
            }
        }
    }

    function removeTokenList(string memory _name) external override onlyOwner {
        bytes memory byteName = bytes(_name);
        require(byteName.length != 0, 'NO_NAME');
        bool arrayOffset;
        for(uint256 x; x < _tokenLists.length - 1; x++) {
            if (keccak256(abi.encodePacked(_tokenLists[x].name)) == keccak256(abi.encodePacked(_name))) {
                arrayOffset = true;
            }
            if (arrayOffset) _tokenLists[x] = _tokenLists[x + 1];
        }
        if (arrayOffset) _tokenLists.pop();
    }

    function clearTokenLists() external override onlyOwner {
        delete _tokenLists;
    }

    function owner() external override view returns(address) {
        return _owner;
    }

    function project() external override view returns(Project memory) {
        return _project;
    }

    function tokenList(string memory _name) external override view returns(string memory _listData) {
        for(uint256 x; x < _tokenLists.length; x++) {
            if (keccak256(abi.encodePacked(_tokenLists[x].name)) == keccak256(abi.encodePacked(_name))) {
                return _tokenLists[x].data;
            }
        }
    }

    function tokenLists() external override view returns(string[] memory) {
        string[] memory lists = new string[](_tokenLists.length);
        for(uint256 x; x < _tokenLists.length; x++) {
            lists[x] = _tokenLists[x].data;
        }
        return lists;
    }

    function _setDomain(string memory _domain) private {
        _project.domain = _domain;
    }

    function _setProjectName(string memory _name) private {
        _project.name = _name;
    }

    function _setLogoUrl(string memory _logo) private {
        _project.logo = _logo;
    }

    function _setBrandColor(string memory _color) private {
        _project.brandColor = _color;
    }

    function _addTokenList(string memory _name, string memory _data) private {
        bytes memory byteName = bytes(_name);
        require(byteName.length != 0, 'NO_NAME');
        bool exist;
        for(uint256 x; x < _tokenLists.length; x++) {
            if (keccak256(abi.encodePacked(_tokenLists[x].name)) == keccak256(abi.encodePacked(_name))) {
                _tokenLists[x].name = _name;
                _tokenLists[x].data = _data;
                exist = true;
            }
        }
        if (!exist) _tokenLists.push(TokenList({name: _name, data: _data}));
    }

    function _addTokenLists(TokenList[] memory _lists) private {
        require(_lists.length > 0, 'NO_DATA');
        for(uint256 x; x < _lists.length; x++) {
            _addTokenList(_lists[x].name, _lists[x].data);
        }
    }
}