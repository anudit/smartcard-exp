const { NFC, KEY_TYPE_A, KEY_TYPE_B } = require('nfc-pcsc');
const { table } = require('table');

const nfc = new NFC();
const TRANSPORT_KEY = "FFFFFFFFFFFF";

nfc.on('reader', reader => {

	console.log(`${reader.reader.name}  device attached`);

	// enable when you want to auto-process ISO 14443-4 tags (standard=TAG_ISO_14443_4)
	// when an ISO 14443-4 is detected, SELECT FILE command with the AID is issued
	// the response is available as card.data in the card event
	// see examples/basic.js line 17 for more info
	// reader.aid = 'F222222222';

	reader.on('card', async (card) => {

		// card is object containing following data
		// [always] String type: TAG_ISO_14443_3 (standard nfc tags like MIFARE) or TAG_ISO_14443_4 (Android HCE and others)
		// [always] String standard: same as type
		// [only TAG_ISO_14443_3] String uid: tag uid
		// [only TAG_ISO_14443_4] Buffer data: raw data from select APDU response

		console.log(`${reader.reader.name}  card detected`, card);

        let SECTOR_START = 4
        let SECTOR_END = 16

        let keyTypes = [KEY_TYPE_A, KEY_TYPE_B]
        let keys = [TRANSPORT_KEY, "A0A1A2A3A4A5", "D3F7D3F7D3F7"]
        let parsedMatrix = [['sector', 'config', 'data']];

        for(let cur = SECTOR_START; cur < SECTOR_END; cur+=1) {

            for(let kt = 0; kt < keyTypes.length; kt++){
                
                for(let ki = 0; ki < keys.length; ki++){
                    
                    try {
        
                        console.log('USING', kt == 0 ? "A" : "B", keys[ki])

                        await reader.authenticate(cur, keyTypes[kt], keys[ki]);
        
                        try {
                            const data = await reader.read(cur, 64, 16); // Read entire sector
                            parsedMatrix.push([
                                cur, 
                                (kt == 0 ? "A" : "B")+ki, 
                                data.toString('hex')
                            ])
        
                        } catch (err) {
                            // console.log(`error when reading data`);
                            continue;
                        }
        
                    
                    } catch (err) {
                        // console.log(`error when authenticating data`);
                        // return;
                        continue;
                    }


                }

            }
            
        }

        console.log(table(parsedMatrix))


	});

	reader.on('card.off', card => {
		console.log(`${reader.reader.name}  card removed`, card);
	});

	reader.on('error', err => {
		console.log(`${reader.reader.name}  an error occurred`, err);
	});

	reader.on('end', () => {
		console.log(`${reader.reader.name}  device removed`);
	});

});

nfc.on('error', err => {
	console.log('an error occurred', err);
});