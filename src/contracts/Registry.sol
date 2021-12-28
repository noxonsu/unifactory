// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Registry {
    struct Domain {
        address admin;
        address factory;
        address router;
    }

    struct FullDomain {
        address admin;
        address factory;
        address router;
        address storageAddr;
    }

    mapping(string => Domain) public domainData;
    mapping(string => address) public domainStorage;
    string[] private _domains;

    modifier onlyAdmin(string memory _domainName) {
        require(domainData[_domainName].admin != address(0), 'NO_DOMAIN_DATA');
        require(msg.sender == domainData[_domainName].admin, 'FORBIDDEN');
        _;
    }

    modifier notEmpty(string memory _value) {
        bytes memory byteValue = bytes(_value);
        require(byteValue.length != 0, 'NO_VALUE');
        _;
    }

    function addDomainData(string memory _domainName, Domain memory _data) external notEmpty(_domainName) {
        if (domainData[_domainName].admin != address(0)) {
            require(msg.sender == domainData[_domainName].admin, 'FORBIDDEN');
        } else {
            _domains.push(_domainName);
        }
        domainData[_domainName].admin = _data.admin;
        domainData[_domainName].factory = _data.factory;
        domainData[_domainName].router = _data.router;
    }

    function addDomainStorage(string memory _domainName, address _storage) external notEmpty(_domainName) onlyAdmin(_domainName) {
        domainStorage[_domainName] = _storage;
    }

    function removeDomain(string memory _domainName) external notEmpty(_domainName) onlyAdmin(_domainName) {
        delete domainData[_domainName];
        Domain memory emptyDomain = domainData[_domainName];
        require(
            emptyDomain.admin == address(0) &&
            emptyDomain.factory == address(0) &&
            emptyDomain.router == address(0),
            'MAIN_DOMAIN_DATA_NOT_DELETED'
        );
        delete domainStorage[_domainName];
        require(domainStorage[_domainName] == address(0), 'STORAGE_NOT_DELETED');
        bool arrayOffset;
        for(uint x; x < _domains.length - 1; x++) {
            if (keccak256(abi.encodePacked(_domains[x])) == keccak256(abi.encodePacked(_domainName))) {
                arrayOffset = true;
            }
            if (arrayOffset) _domains[x] = _domains[x + 1];
        }
        if (arrayOffset) _domains.pop();
    }

    function domain(string memory _name) external view notEmpty(_name) returns(FullDomain memory) {
        return _domain(_name);
    }

    function domains() external view returns(string[] memory) {
        return _domains;
    }

    function allDomainsData() external view returns(FullDomain[] memory) {
        FullDomain[] memory _allDomains = new FullDomain[](_domains.length);
        for(uint x; x < _domains.length; x++) {
            _allDomains[x] = _domain(_domains[x]);
        }
        return _allDomains;
    }

    function _domain(string memory _name) private view notEmpty(_name) returns(FullDomain memory _data) {
        _data = FullDomain({
            admin: domainData[_name].admin,
            factory: domainData[_name].factory,
            router: domainData[_name].router,
            storageAddr: domainStorage[_name]
        });
    }
}