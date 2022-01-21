weenus https://rinkeby.etherscan.io/address/0x0440c9ac98e9dce9cf1d37236481464ffc7c68a0 (send 0 eth to this address) 

xeenus https://rinkeby.etherscan.io/address/0xcc8b19e3c0202d41231291ef15fd19161a515d72 (send 0 eth to this address)

# How to test. 

1. create 3 addresses. admin, LP, user and topup https://faucet.rinkeby.io/ . 
2. deploy dex. 
3. set 10% total fee, set 50% admin fee
4. switch to LP's adddres
5. add 500/500 weenus/xeenus pool. 
6. switch to Users's address. 
7. exchange 10 weenus to 10 xeenus. (note user will recieve less then 0.9 xeenus)
8. switch to LP and check note that weenus + xeenus total balance is higher :)
9. remove liquidity 

now check the "remove liquidity" transaction. 
