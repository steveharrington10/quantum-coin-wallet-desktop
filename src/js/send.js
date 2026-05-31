const COIN_SEND_GAS = 21000;
const TOKEN_SEND_GAS = 84000;

let sendShowUnrecognizedTokens = false;

function resetTokenList() {
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    removeOptions(ddlCoinTokenToSend);
    var option = document.createElement("option");
    option.text = "Q";
    option.value = "Q";
    ddlCoinTokenToSend.add(option);
    if (offlineSignEnabled === true) {
        var optOther = document.createElement("option");
        optOther.text = "(token)";
        optOther.value = "other";
        ddlCoinTokenToSend.add(optOther);
    }
}

function addTokenOptionToSendDropdown(ddlCoinTokenToSend, token) {
    let tokenName = token.name;

    if (tokenName.length > maxTokenNameLength) {
        tokenName = tokenName.substring(0, maxTokenNameLength - 1) + "...";
    }
    tokenName = htmlEncode(tokenName);

    let tokenOption = document.createElement("option");
    tokenOption.text = tokenName;
    tokenOption.value = token.contractAddress;
    ddlCoinTokenToSend.add(tokenOption);
}

function populateSendScreen() {
    resetTokenList();

    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");

    //Recognized tokens are always listed; unrecognized only when the toggle is on.
    //Stablecoin impersonators are already removed upstream so they never appear here.
    if (currentWalletRecognizedTokens != null) {
        for (var i = 0; i < currentWalletRecognizedTokens.length; i++) {
            addTokenOptionToSendDropdown(ddlCoinTokenToSend, currentWalletRecognizedTokens[i]);
        }
    }

    if (sendShowUnrecognizedTokens === true && currentWalletUnrecognizedTokens != null) {
        for (var j = 0; j < currentWalletUnrecognizedTokens.length; j++) {
            addTokenOptionToSendDropdown(ddlCoinTokenToSend, currentWalletUnrecognizedTokens[j]);
        }
    }

    //The toggle is only shown when there are unrecognized tokens to reveal.
    let toggleRow = document.getElementById("divSendShowUnrecognized");
    if (currentWalletUnrecognizedTokens != null && currentWalletUnrecognizedTokens.length > 0) {
        toggleRow.style.display = '';
    } else {
        toggleRow.style.display = 'none';
    }
}

function onToggleSendUnrecognized() {
    sendShowUnrecognizedTokens = document.getElementById("chkSendShowUnrecognized").checked === true;
    populateSendScreen();
    updateInfoSendScreen();
}

// Re-sync the send dropdown/toggle when the token list loads (or refreshes)
// while the send screen is already open, so the unrecognized-tokens checkbox
// appears as soon as the data arrives. The current selection is preserved.
function syncSendScreenTokenList() {
    let sendScreen = document.getElementById("SendScreen");
    if (sendScreen == null || sendScreen.style.display === "none") {
        return;
    }

    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    let previousValue = ddlCoinTokenToSend.value;
    let previousContractInput = document.getElementById("txtTokenContractAddress").value;

    populateSendScreen();

    for (let i = 0; i < ddlCoinTokenToSend.options.length; i++) {
        if (ddlCoinTokenToSend.options[i].value === previousValue) {
            ddlCoinTokenToSend.value = previousValue;
            break;
        }
    }

    updateInfoSendScreen();

    //Preserve a manually-typed token contract (offline "(token)" entry) that
    //updateInfoSendScreen clears when re-selecting the manual option.
    if (previousValue === "other") {
        document.getElementById("txtTokenContractAddress").value = previousContractInput;
    }
}

async function updateInfoSendScreen() {
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    let selectedValue = ddlCoinTokenToSend.value;
    document.getElementById("divCoinTokenToSend").textContent = "";
    document.getElementById("divCoinTokenToSend").style.display = "";
    document.getElementById("divBalanceSendScreen").textContent = "";
    document.getElementById("txtTokenContractAddress").style.display = "none";

    if(offlineSignEnabled == true) {
        document.getElementById("divSendScreenBalanceBox").style.display = "none";
    } else {
        document.getElementById("divSendScreenBalanceBox").style.display = "false";
    }

    if(selectedValue === "Q") {
        document.getElementById("divCoinTokenToSend").textContent = QuantumCoin;
        if(offlineSignEnabled === false) {
            if (currentAccountDetails !== null) {
                let newBalance = await weiToEtherFormatted(currentAccountDetails.balance);
                document.getElementById("divBalanceSendScreen").textContent = newBalance;
            }
        }
    } else {
        if(offlineSignEnabled === true) {
            let txtContract = document.getElementById("txtTokenContractAddress");
            document.getElementById("divCoinTokenToSend").style.display = "none";
            txtContract.style.display = "";
            if (selectedValue === "other") {
                //Manual entry: let the user type the contract address.
                txtContract.value = "";
                txtContract.readOnly = false;
            } else {
                //A real token was picked from the list; use its contract address.
                txtContract.value = selectedValue;
                txtContract.readOnly = true;
            }
        } else {
            for (let i = 0; i < currentWalletTokenList.length; i++) {
                if (currentWalletTokenList[i].contractAddress === selectedValue) {
                    document.getElementById("divBalanceSendScreen").textContent = currentWalletTokenList[i].tokenBalance;
                    document.getElementById("divCoinTokenToSend").textContent = selectedValue;
                    break;
                }
            }
        }
    }

    return false;
}

async function showSendScreen() {
    offlineSignEnabled = await offlineTxnSigningGetDefaultValue();
    sendShowUnrecognizedTokens = false;
    document.getElementById("chkSendShowUnrecognized").checked = false;
    document.getElementById("txtTokenContractAddress").readOnly = false;
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    ddlCoinTokenToSend.disabled = true;
    populateSendScreen();
    await updateInfoSendScreen();
    ddlCoinTokenToSend.disabled = false;

    if (offlineSignEnabled === true) {
        document.getElementById("btnOfflineSign").style.display  = "block";
        document.getElementById("divCurrentNonce").style.display  = "block";
        document.getElementById("btnSendCoins").style.display  = "none";
    } else {
        document.getElementById("btnOfflineSign").style.display  = "none";
        document.getElementById("divCurrentNonce").style.display  = "none";
        document.getElementById("btnSendCoins").style.display  = "block";
    }

    document.getElementById('divNetworkDropdown').style.display = 'none';
    document.getElementById('HomeScreen').style.display = 'none';
    document.getElementById('SendScreen').style.display = 'block';
    document.getElementById('OfflineSignScreen').style.display = 'none';
    document.getElementById('gradient').style.height = '116px';
    document.getElementById("txtSendAddress").value = "";
    document.getElementById("txtSendQuantity").value = "";
    document.getElementById("txtCurrentNonce").value = "";
    document.getElementById("pwdSend").value = "";
    document.getElementById("txtSendAddress").focus();

    return false;
}

async function signOfflineSend() {
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;
    var currentNonce = document.getElementById("txtCurrentNonce").value;
    var sendPassword = document.getElementById("pwdSend").value;
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    let selectedValue = ddlCoinTokenToSend.value;
    let CoinTokenToSendName = "";
    if(selectedValue === "Q") {
        CoinTokenToSendName = "coins";
    } else {
        let contractAddress = document.getElementById("txtTokenContractAddress").value;
        if (contractAddress == null || contractAddress.length < ADDRESS_LENGTH_CHECK || await IsValidAddress(contractAddress) == false) {
            showWarnAlert(langJson.errors.quantumAddr);
            return false;
        }
        CoinTokenToSendName = "tokens";
    }

    if (sendAddress == null || sendAddress.length < ADDRESS_LENGTH_CHECK || await IsValidAddress(sendAddress) == false) {
        showWarnAlert(langJson.errors.quantumAddr);
        return false;
    }

    if (sendQuantity == null || sendQuantity.length < 1) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    let okQuantity = await isValidEther(sendQuantity);
    if (isValidEther(okQuantity) == false) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    if (currentNonce == null || currentNonce.length < 1) {
        showWarnAlert(langJson.errors.enterCurrentNonce);
        return false;
    }

    let tempNonce = parseInt(currentNonce);
    if (Number.isInteger(tempNonce) == false || tempNonce < 0) {
        showWarnAlert(langJson.errors.enterCurrentNonce);
        return false;
    }

    if (sendPassword == null || sendPassword.length < 2) {
        showWarnAlert(langJson.errors.enterQuantumPassword);
        return false;
    }

    let msg = langJson.langValues.signSendConfirm;
    msg = msg.replace("[SEND_QUANTITY]", sendQuantity);
    msg = msg.replace("[TO_ADDRESS]", sendAddress);
    msg = msg.replace("[NONCE]", tempNonce);
    msg = msg.replace("[SEND_COINTOKEN]", CoinTokenToSendName); //already htmlEncoded
    showConfirmAndExecuteOnConfirm(msg, onSignOfflineSendCoinsConfirm);
}

async function onSignOfflineSendCoinsConfirm() {
    showLoadingAndExecuteAsync(langJson.langValues.waitWalletOpen, decryptAndUnlockWalletSignOffline);
}

async function decryptAndUnlockWalletSignOffline() {
    var password = document.getElementById("pwdSend").value;
    try {
        let quantumWallet = await walletGetByAddress(password, currentWalletAddress);
        if (quantumWallet == null) {
            hideWaitingBox();
            showWarnAlert(getGenericError());
            return;
        }
        signOfflineTxnSend(quantumWallet);
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
        return;
    }
    return false;
}

async function signOfflineTxnSendToken(quantumWallet) {
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;
    var currentNonce = document.getElementById("txtCurrentNonce").value;
    var contractAddress = document.getElementById("txtTokenContractAddress").value;

    try {
        var result = await offlineSignTokenTransaction({
            chainId: parseInt(currentBlockchainNetwork.networkId, 10),
            toAddress: sendAddress,
            amount: sendQuantity,
            contractAddress: contractAddress,
            fromDecimals: getSwapTokenDecimals(contractAddress),
            nonce: parseInt(currentNonce),
            gasLimit: TOKEN_SEND_GAS,
            privateKey: await quantumWallet.getPrivateKey(),
            publicKey: await quantumWallet.getPublicKey(),
            advancedSigningEnabled: await advancedSigningGetDefaultValue()
        });

        if (!result || !result.success || !result.txData) {
            hideWaitingBox();
            showWarnAlert((result && result.error) ? String(result.error) : (langJson.errors.unexpectedError));
            return;
        }

        hideWaitingBox();
        document.getElementById('txtSignedSendTransaction').value = result.txData;
        document.getElementById('SendScreen').style.display = "none";
        document.getElementById('OfflineSignScreen').style.display = "block";
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
    }
}

async function signOfflineTxnSend(quantumWallet) {
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    let selectedValue = ddlCoinTokenToSend.value;
    if(selectedValue === "Q") {

    } else {
        await signOfflineTxnSendToken(quantumWallet);
        return;
    }
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;
    var currentNonce = document.getElementById("txtCurrentNonce").value;

    try {
        var result = await offlineSignCoinTransaction({
            chainId: parseInt(currentBlockchainNetwork.networkId, 10),
            toAddress: sendAddress,
            amount: sendQuantity,
            nonce: parseInt(currentNonce),
            gasLimit: COIN_SEND_GAS,
            privateKey: await quantumWallet.getPrivateKey(),
            publicKey: await quantumWallet.getPublicKey(),
            advancedSigningEnabled: await advancedSigningGetDefaultValue()
        });

        if (!result || !result.success || !result.txData) {
            hideWaitingBox();
            showWarnAlert((result && result.error) ? String(result.error) : (langJson.errors.unexpectedError));
            return;
        }

        hideWaitingBox();
        document.getElementById('txtSignedSendTransaction').value = result.txData;
        document.getElementById('SendScreen').style.display = "none";
        document.getElementById('OfflineSignScreen').style.display = "block";
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
    }
}

async function copySignedSendTransaction() {
    await WriteTextToClipboard(document.getElementById('txtSignedSendTransaction').value);
}

async function openOfflineTxnSigningUrl() {
    await OpenUrl("https://QuantumCoin.org/offline-transaction-signing.html");
    return false;
}

async function sendCoins() {
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;
    var sendPassword = document.getElementById("pwdSend").value;
    let ddlCoinTokenToSend = document.getElementById("ddlCoinTokenToSend");
    var CoinTokenToSendName = ddlCoinTokenToSend.options[ddlCoinTokenToSend.selectedIndex].text;
    var contractAddress = document.getElementById("divCoinTokenToSend").textContent;
    let quantityToSend = "";

    if (sendAddress == null || sendAddress.length < ADDRESS_LENGTH_CHECK || await IsValidAddress(sendAddress) == false) {
        showWarnAlert(langJson.errors.quantumAddr);
        return false;
    }

    if (sendQuantity == null || sendQuantity.length < 1) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    let okQuantity = await isValidEther(sendQuantity);
    if (isValidEther(okQuantity) == false) {
        showWarnAlert(langJson.errors.enterAmount);
        return false;
    }

    if(contractAddress === QuantumCoin) {
        quantityToSend = currentBalance;
        CoinTokenToSendName = langJson.langValues.coins;
    } else {
        quantityToSend = getTokenBalance(contractAddress);
        CoinTokenToSendName = langJson.langValues.tokens;
    }

    if (quantityToSend == null || quantityToSend === "") {
        showWarnAlert(langJson.errors.amountLarge);
        return false;
    }

    let compareResult = await compareEther(sendQuantity, quantityToSend);
    if (compareResult == 1) {
        showWarnAlert(langJson.errors.amountLarge);
        return false;
    }

    if (sendPassword == null || sendPassword.length < 2) {
        showWarnAlert(langJson.errors.enterQuantumPassword);
        return false;
    }

    let msg = langJson.langValues.sendConfirm;
    msg = msg.replace("[SEND_QUANTITY]", sendQuantity);
    msg = msg.replace("[TO_ADDRESS]", sendAddress);
    msg = msg.replace("[SEND_COINTOKEN]", CoinTokenToSendName); //already htmlEncoded
    showConfirmAndExecuteOnConfirm(msg, onSendCoinsConfirm);
}

async function onSendCoinsConfirm() {
    showLoadingAndExecuteAsync(langJson.langValues.waitWalletOpen, decryptAndUnlockWalletSend);
}

async function decryptAndUnlockWalletSend() {
    var password = document.getElementById("pwdSend").value;
    try {
        let quantumWallet = await walletGetByAddress(password, currentWalletAddress);
        if (quantumWallet == null) {
            hideWaitingBox();
            showWarnAlert(getGenericError());
            return;
        }
        sendCoinsSubmit(quantumWallet);
    }
    catch (error) {
        hideWaitingBox();
        showWarnAlert(langJson.errors.walletOpenError.replace(STORAGE_PATH_TEMPLATE, STORAGE_PATH) + " " + error)
        return;
    }
    return false;
}

async function sendCoinsSubmit(quantumWallet) {
    let coinTokenToSend = document.getElementById("divCoinTokenToSend").textContent;
    if(coinTokenToSend !== QuantumCoin) {
        await sendTokensSubmit(quantumWallet);
        return;
    }

    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);
    var sendAddress = document.getElementById("txtSendAddress").value;
    var sendQuantity = document.getElementById("txtSendQuantity").value;

    try {
        let currentDate = new Date();
        var result = await submitSendCoins({
            rpcEndpoint: currentBlockchainNetwork.rpcEndpoint,
            chainId: parseInt(currentBlockchainNetwork.networkId, 10),
            toAddress: sendAddress,
            amount: sendQuantity,
            privateKey: await quantumWallet.getPrivateKey(),
            publicKey: await quantumWallet.getPublicKey(),
            gasLimit: COIN_SEND_GAS,
            advancedSigningEnabled: await advancedSigningGetDefaultValue()
        });

        if (!result || !result.success || !result.txHash) {
            hideWaitingBox();
            showWarnAlert((result && result.error) ? String(result.error) : (langJson.errors.invalidApiResponse));
            return;
        }

        let pendingTxn = new TransactionDetails(result.txHash, currentDate, quantumWallet.address, sendAddress, sendQuantity, true);
        pendingTransactionsMap.set(quantumWallet.address.toLowerCase() + currentBlockchainNetwork.index.toString(), pendingTxn);

        setTimeout(() => {
            hideWaitingBox();
            showAlertAndExecuteOnClose(langJson.langValues.sendRequest.replace(TRANSACTION_HASH_TEMPLATE, result.txHash), showWalletScreen);
        }, 1000);
    }
    catch (error) {
        hideWaitingBox();

        if (isNetworkError(error)) {
            showWarnAlert(langJson.errors.internetDisconnected);
        } else {
            showWarnAlert(langJson.errors.invalidApiResponse + ' ' + error);
        }
    }
}

async function sendTokensSubmit(quantumWallet) {
    updateWaitingBox(langJson.langValues.pleaseWaitSubmit);

    try {
        var sendAddress = document.getElementById("txtSendAddress").value;
        var sendQuantity = document.getElementById("txtSendQuantity").value;
        var contractAddress = document.getElementById("divCoinTokenToSend").textContent;

        let currentDate = new Date();
        var result = await submitSendTokens({
            rpcEndpoint: currentBlockchainNetwork.rpcEndpoint,
            chainId: parseInt(currentBlockchainNetwork.networkId, 10),
            toAddress: sendAddress,
            amount: sendQuantity,
            contractAddress: contractAddress,
            fromDecimals: getSwapTokenDecimals(contractAddress),
            privateKey: await quantumWallet.getPrivateKey(),
            publicKey: await quantumWallet.getPublicKey(),
            gasLimit: TOKEN_SEND_GAS,
            advancedSigningEnabled: await advancedSigningGetDefaultValue()
        });

        if (!result || !result.success || !result.txHash) {
            hideWaitingBox();
            showWarnAlert((result && result.error) ? String(result.error) : (langJson.errors.invalidApiResponse));
            return;
        }

        let pendingTxn = new TransactionDetails(result.txHash, currentDate, quantumWallet.address, contractAddress, "0", true);
        pendingTransactionsMap.set(quantumWallet.address.toLowerCase() + currentBlockchainNetwork.index.toString(), pendingTxn);

        setTimeout(() => {
            hideWaitingBox();
            showAlertAndExecuteOnClose(langJson.langValues.sendRequest.replace(TRANSACTION_HASH_TEMPLATE, result.txHash), showWalletScreen);
        }, 1000);
    }
    catch (error) {
        hideWaitingBox();

        if (isNetworkError(error)) {
            showWarnAlert(langJson.errors.internetDisconnected);
        } else {
            showWarnAlert(langJson.errors.invalidApiResponse + ' ' + error);
        }
    }
}