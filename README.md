# SFRA Giftcert Plugin
Salesforce Reference Architecture currently does not have the ability to support gift certificate purchases. However, the native gift certificate exists in demandware.

The gift certificate cartridge here is based on [Clutch cartridge](https://github.com/SalesforceCommerceCloud/link_clutch). It is a simplified version that removes all API calls to get gift certificate feature working in SFRA.

# Compatibility
It's tested with latest V5 base cartridge (app_storefront_base). It should be compatible with V6 too but haven't been tested yet.

# Setup steps
1. Upload the cartridge to your code version.
   1. add a `dw.json` file as explained [here](https://documentation.b2c.commercecloud.salesforce.com/DOC2/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fsfra%2Fb2c_uploading_code.html)
   2. run `npm install`
   3. run `sgmf-scripts --uploadCartridge int_gc_sfra`   
2. Add “int_gc_sfra” to the most left of the cartridge path
3. Hit the “Giftcards-Purchase” endpoint to open the gift cert purchase page

## Fix the footer link
In Business Manager:
* Go to Merchant Tools > Content > Content Assets
* Open footer-support
* Add/Edit the following line
```
<li><a href="$httpsUrl('Giftcards-Purchase')$" title="Go to Gift Certificates">Gift Certificates</a></li>
```

