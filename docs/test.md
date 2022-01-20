weenus https://rinkeby.etherscan.io/address/0x0440c9ac98e9dce9cf1d37236481464ffc7c68a0 (send 0.01 eth in rinkeby)
xeenus https://rinkeby.etherscan.io/address/0xcc8b19e3c0202d41231291ef15fd19161a515d72 (send 0.01 eth in rinkeby)

# How to test. 

0. create 3 addresses. admin, LP, user and topup https://faucet.rinkeby.io/ . 
1. 
2. deploy dex. 
3. set 10% total fee (50/50 admin/lp). 
4. switch to LP's adddres
5. add 100/100 weenus/xeenus pool. 
6. switch to Users's address. 
7. exchange 10 weenus to 10 xeenus. 
8. now total fee accumulated in pool is ~1 weenus. 
9. switch to LP and remove pool. 

now check the "remove liquidity" transaction. ~0.5 weenus goes to the LP, ~0.5 weenus goes to the Admin. 
