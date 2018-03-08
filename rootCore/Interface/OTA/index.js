const Promise = require('bluebird');
const jwt = require('rootCore/customlib/rn-jsonwebtoken.js');
const APDU = require('rootCore/helper/apdu/index.js');
const loadScript = require('./script/loadScript.js');
const installScript = require('./script/installScript.js');
const deleteScript = require('./script/deleteScript.js');
const VERSION = require('rootCore/config/version.js');
const InformNative = require('rootCore/helper/informNative.js');

exports.SEUpdate = async (data) => {
  const { cardId, cardSEVersion } = data;
  let latestVersion;
  try {
    await InformNative.progressBar(14);
    const isUpdate = await exports.isSEUpdate(data);
    await InformNative.progressBar(28);

    latestVersion = isUpdate.message.SEVersion;
    if (!isUpdate.message.isNeedUpdate) {
      await InformNative.progressBar(100);
      return { status: 'success', data: latestVersion };
    }

    const selectOne = 'A000000151000000';
    await APDU.OTA.selectCardManager(selectOne);
    await InformNative.progressBar(36);

    const selectTwo = 'A000000151535041';
    await APDU.OTA.selectCardManager(selectTwo);
    await InformNative.progressBar(40);

    await mutualAuthorization(cardId);
    await InformNative.progressBar(44);

    await insertDeleteScript(deleteScript);
    const defaultStartingProgress = 50;
    await InformNative.progressBar(defaultStartingProgress);
    console.log('Delete Card Manager Done');

    await insertLoadScript(loadScript, defaultStartingProgress);
    await InformNative.progressBar(87);
    console.log('Load OTA Script Done');

    await insertScript(installScript, 'Install Script Failed!');
    await APDU.Other.closePower();
    await InformNative.progressBar(100);
    console.log('Install OTA Script Done');

    return { status: 'success', message: latestVersion };
  } catch (e) {
    return { status: 'failed', message: latestVersion };
  };
};

exports.isSEUpdate = async (params) => {
  try {
    const { cardSEVersion } = params;
    const versionObj = VERSION.SE_VERSION_LIST[VERSION.SE_VERSION_LIST.length - 1];
    const keyArr = Object.keys(versionObj);
    const applatestSEVersion = keyArr[0];
    let isUpdate = true;;
    let latestVersion = applatestSEVersion;
    console.log(`applatestSEVersion : ${applatestSEVersion}`);
    console.log(`cardSEVersion : ${cardSEVersion}`);
    if (applatestSEVersion <= cardSEVersion) {
      isUpdate = false;
      latestVersion = cardSEVersion;
    }

    const data = { SEVersion: latestVersion, isNeedUpdate: isUpdate }
    return { status: 'success', message: data };
  } catch (e) {
    return { status: 'failed', message: e };
  }
};

exports.selectApplet = async () => {
  try {
    const appletCommand = 'C1C2C3C3C4C5';
    const { status } = await APDU.OTA.selectCardManager(appletCommand);

    let isExist = true;
    if (status == '6a82') {
      isExist = false;
    }

    return { status: 'success', message: isExist };
  } catch (e) {
    return { status: 'failed', message: e };
  }
};

const mutualAuthorization = async (cardId) => {
  try {
    const challengeUrl = `https://ota.cbx.io/api/challenge`;
    const challengeData = { cwid: cardId };
    const challengeObj = await getAuth(challengeUrl, challengeData);
    const challenge = challengeObj.outputData;
    console.log(`Challenge : ${challenge}`);

    const cryptogramUrl = `https://ota.cbx.io/api/cryptogram`;
    const cryptogramData = { cryptogram: challenge , cwid: cardId };
    await getAuth(cryptogramUrl, cryptogramData);

  } catch (e) {
    throw "Mutual Authorization Failed!"
  };
};

const insertScript = async (scriptHex, err) => {
  try {
    const scripts = await parseOTAScript(scriptHex);
    await Promise.each(scripts, async (script) => {
      const { CLA, INS, P1, P2, packets } = script;
      await APDU.OTA.cardRequest(CLA, INS, P1, P2, packets);
    });
    return;
  } catch (e) {
    throw err + e;
  };
};

const insertLoadScript = async (scriptHex, progress) => {
  try {
    let progressIncrement = progress + 1;
    const scripts = await parseOTAScript(scriptHex);
    await Promise.each(scripts, async (script, index) => {
      const { CLA, INS, P1, P2, packets } = script;
      await APDU.OTA.cardRequest(CLA, INS, P1, P2, packets);

      if (index % 5 == 0) {
        await InformNative.progressBar(progressIncrement++);
      }
    });
    return;
  } catch (e) {
    throw e;
  };
};

const insertDeleteScript = async (scriptHex) => {
  try {
    const scripts = await parseOTAScript(scriptHex);
    await Promise.each(scripts, async (script) => {
      const { CLA, INS, P1, P2, packets } = script;
      const { status } = await APDU.OTA.cardRequest(CLA, INS, P1, P2, packets, true);

      // Applet is not exits mean applet already deleted!
      if (status.toLowerCase() == "6a88" || status.toLowerCase() == "9000") {
        return;
      }

      throw "Delete failed"
    });
  } catch (e) {
    throw "Delete Script Failed! " +e;
  };
};

const parseOTAScript = async (OTAScript) => {
  try {
    const allApplet = OTAScript.split(/\n/);
    const parsedAPDU = await Promise.map(allApplet, (data, i) => {
      const CLA = data.slice(0, 2);
      const INS = data.slice(2, 4);
      const P1 = data.slice(4, 6);
      const P2 = data.slice(6, 8);
      const packets = data.slice(8);

      if (CLA != "80") throw `Problem in OTA Script in line ${i}`;
      return { CLA, INS, P1, P2, packets };
    });

    return parsedAPDU;
  } catch (e) {
    throw e;
  };
};

const getAuth = (url, data) => {
  const secret = 'd579bf4a2883cecf610785c49623e1';
  const payload = jwt.sign(data, secret, { expiresIn: 60 * 60 * 24 });

  const body = {
    keyNum: '1',
    payload,
  };

  const options = {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  return fetch(url, options)
  .then((result) => {
    const bodyText = JSON.parse(result._bodyText)
    if(!!bodyText.error) {
      throw bodyText.error.message
    }
    return jwt.decode(bodyText.cryptogram);
  })
  .then((obj) => {
    console.log(`Server Auth Response : ${JSON.stringify(obj)}`);
    const { CLA, INS, P1, P2, packets } = obj;
    return APDU.OTA.cardRequest(CLA, INS, P1, P2, packets);
  });
};
