White Label Exchange Solution based on uniswap.org's sources. Set up your commission from 0.05% to 20%. 

Admin can create own DEX. Add logo, change colors, use own domain name, add/edit token to tokenlist (main dropdown). 

- Deploy smartcontract in 2 clicks
- New DEX will be created without liquidity

# Price
It's free but 20% of your revenue will forward to our development fund. We will use this to support the software up to date. 

# Can i trust you? 
This tool was developed by the team who made MCW wallet ([trusted by 1000+ webmasters](https://codecanyon.net/item/multicurrency-crypto-wallet-and-exchange-widgets-for-wordpress/23532064)). We use uniswap.org sources with small changes, you can check the sources of smartcontract after deployment then compare it with the verified uniswap's contracts. We don't have access to the pools. We do our best to prevent all damages to our users, anywayг use this software at your own risk. 

# Installation

## Fastest way. 
Click here to run your own DEX on random subdomain *.onout.xyz https://randomredirect.i4.workers.dev/

## DNS way. Simple and secured way. Most recommended.
The only password you need is your domain registrar's password, you don't need a server. app.uniswap.org uses the same. 

1. log in to your domain provider (where you have registered domain name)
2. Open DNS setting of your domain and add CNAME record `your.domain` - `https://cloudflare-ipfs.com/` (see how to do this in your registar: [GoDaddy](https://www.google.com/search?q=how+to+add+cname+in+godaddy), [Namecheap](https://www.google.com/search?q=how+to+add+cname+in+Namecheap), [Cloudflare](https://www.google.com/search?q=how+to+add+cname+in+Cloudflare)
)
3. TXT record for `_dnslink.your.website` with the value `dnslink=/ipfs/QmUh7FY9391Gya8tW7wK6Haz14n9eompxUQm4QmfDDhH7K`

That's it! Now open your domain and you'll see the installation master! 

### Preview

<img src="./images/deploymentTab.png">

---

Once you finish this form the domain will be linked to your MetaMask address (your eth address will be recorded as "admin" of your domain in the "domain registry" smart contract. TODO: добавить линки на этот реестр в разных сетях).

# Support and updates
Join the channel https://t.me/unifactory_channel
