const APDU = require('rootCore/helper/apdu/index.js');
const EVENT = require('rootCore/config/event.js');
const APDUCONFIG = require('rootCore/config/apdu.js')
const {DFU_RESPONSE} = APDUCONFIG;
const Promise = require("bluebird");

exports.deviceFWUpdate = async (OTAdata) => {
    let result = {};
    let fwVersion = "";
    let updateVersion = "";
    let sig = "";
    let ota = "";
    const {program_a, program_b, sig_a, sig_b} = OTAdata;

    try {
        const info = await APDU.Dfu.getFWStatus();
        console.log(`OTAdata : ${OTAdata.sig_a}`);

        const fwStatus = info.outputData.slice(10, 14); //3900
        console.log('fwStatus:' + fwStatus);

        /* Decide to update Porgram_A、Program_B or not. */
        if (fwStatus === '3900') {
            sig = sig_a;
            ota = program_a;
            fwVersion = program_a.slice(0, 8);
            updateVersion = info.outputData.slice(14, 22)
        } else {
            sig = sig_b;
            ota = program_b;
            fwVersion = program_b.slice(0, 8);
            updateVersion = info.outputData.slice(14, 22)
        }

        /* Check update */
        const isDFU = checkUpdate(fwVersion, updateVersion);

        console.log(`fwVersion : ${fwVersion}`, `updateVersion : ${updateVersion}`, isDFU);

        if (isDFU) {
            /* pre-update */
            const signState = await APDU.Dfu.sendFWsign(sig);
            if (signState.outputData.slice(8, 10) !== DFU_RESPONSE.SUCCESS)
                throw "Send Sign Failed";
            const restStatus = await APDU.Dfu.FWreset();
            if (restStatus.outputData.slice(8, 10) !== DFU_RESPONSE.SUCCESS)
                throw "Reset Failed";

            /* FW update */
            let dfu_command = await assemblyDFUcommand(ota);
            await executeDFU(dfu_command);

            result = {
                'event': EVENT.DFU_UPDATE,
                status: 'success',
                message: "Firmware update success"
            }

        } else {

            result = {
                'event': EVENT.DFU_UPDATE,
                status: 'success',
                message: "Firmware is up-to-date"
            }
        }
    } catch (e) {
        return result = {
            'event': EVENT.DFU_UPDATE,
            status: 'failed',
            message: e
        }
    }

    return result;
}

exports.getMCUInfo = async () => {
  try {
    const { outputData } = await APDU.Dfu.getMCUVersion();
    const status = outputData.slice(8, 10);
    if (status != "00") throw "Get MCU Version failed!";

    const MCUVersion = outputData.slice(10, 14);
    const MCUDateHex = outputData.slice(14, 22);
    const MCUYear = parseInt(MCUDateHex.slice(0, 4), 16).toString();
    const MCUMonth = parseInt(MCUDateHex.slice(4, 6), 16).toString();
    const MCUDay = parseInt(MCUDateHex.slice(6, 8), 16).toString();
    const MCUDate = MCUYear + MCUMonth + MCUDay;

    return { MCUVersion, MCUDate };
  } catch (e) {
    throw e;
  }
}

const executeDFU = (DFUCmd) => {
    return Promise.each(DFUCmd, async (batch) => {
        const {p1, p2, packets} = batch;
        // console.log('batch:'+packets);
        let result = await APDU.Dfu.FWupdate(p1, p2, packets)
        if (result.outputData.slice(8, 10) !== DFU_RESPONSE.SUCCESS)
            throw "DFU Failed"
    })
}

const assemblyDFUcommand = (data) => {

    const packetLen = 2048 * 2;//hex length is double longer than bytes's
    let result = [];

    const packetNums = Math.ceil(data.length / packetLen);

    let srcPos = 0;
    let dstPos = 0;

    console.log('data length=' + data.length + '/ packetNums=' + packetNums);

    // let p1 = Buffer.from([packetNums]).toString(16)
    let p2 = (packetNums).toString(16);
    if (p2.length % 2 > 0)
        p2 = '0' + p2;

    for (let i = 0; i < packetNums; i++) {
        srcPos = packetLen * i;
        dstPos = (
            packetLen * (i + 1) >= data.length
                ? srcPos + data.length - packetLen * i
                : packetLen * (i + 1));

        let cmd = data.slice(srcPos, dstPos);

        // const {FW_UPDATE} = COMMAND
        let p1 = (i + 1).toString(16);
        if (p1.length % 2 > 0)
            p1 = '0' + p1;

        let obj = {
            'p1': p1,
            'p2': p2,
            'packets': cmd //packet
        };

        // put all ota data to native for executing loop ble command
        result.push(obj)
    }

    return result;
}

const checkUpdate = (hexOldVersion, hexNewVersion) => {

    const oldVersion = new Date(parseInt(hexOldVersion.slice(0, 4), 16), parseInt(hexOldVersion.slice(4, 6), 16), parseInt(hexOldVersion.slice(6, 8), 16))
    const newVersion = new Date(parseInt(hexNewVersion.slice(0, 4), 16), parseInt(hexNewVersion.slice(4, 6), 16), parseInt(hexNewVersion.slice(6, 8), 16))

    return (newVersion >= oldVersion)

}
