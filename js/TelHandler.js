/*
 * Copyright © 2024 Netas Ltd., Switzerland.
 * All rights reserved.
 * @author  Netas AG, support@netas.ch
 * @date    2024-12-06
 */

class TelHandler {

    constructor() {

        try {
            this._settings = null;
            this._http = null;
            this._nrField = document.getElementById('number');
            this._msgDiv = document.getElementById('messages');
            this._numberEntered = false;
            this._darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

            // icon
            this._addIcon();

            // events
            this._nrField.addEventListener('blur', () => { this._onNrFieldBlur(); });
            document.getElementById('callBtn').addEventListener('click', () => { this._onCallBtnClick(); });

            // GET Parameter
            let tel = this._getGetParameter('tel');
            if (tel) {

                // URL-Codierte URL?
                if (tel.substr(0,4) === 'tel:') {
                    tel = decodeURIComponent(tel.substr(4));
                } else if (tel.substr(0,7) === 'callto:') {
                    tel = decodeURIComponent(tel.substr(7));
                }

                this._nrField.value = this._formatNumber(this._cleanupNumber(tel));
                this._numberEntered = this._nrField.value !== '';
            }

            this._nrField.focus();
            this._nrField.addEventListener('keypress', (e) => { this._onNrFieldKeyPress(e); });

            // Settings laden
            let gettingItem = browser.storage.sync.get();
            gettingItem.then((res) => {
                // console.log(res);
                this._settings = res;

                this.init();
            });
        } catch (e) {
            this._showError(e);
        }
    }

    init() {
        this._http = new Http(this._settings.url, this._settings.user, this._settings.password);

        this._http.requestSystemStatus().then((status) => {
            if (status === 200) {
                this._showMessage('phone status', 'OK');
            } else if (status) {
                this._showError(status);
            }

            if (this._settings.doNotPrompt && this._numberEntered) {
                this._makeCall(this._cleanupNumber(this._nrField.value), true);
            }

        }).catch((e) => {
            this._showError(e);
        });
    }

    _addIcon() {
        let ico = document.createElement('link');
        ico.setAttribute('rel', 'icon');
        ico.setAttribute('href', this._darkMode ? 'icons/ico_dark_16.png' : 'icons/ico_light_16.png');
        ico.setAttribute('type', 'image/png');
        document.getElementsByTagName('head')[0].appendChild(ico);
    }

    _makeCall(number, autoCall=false) {
        this._http.makeCall(number, !!this._settings.doNotPrompt, this._settings.callingDevice).then((r) => {

            this._showMessage('call', 'call started');

            // Fenster Schliessen
            if (autoCall) {
                window.setTimeout(() => {
                    if (window.opener) {
                        window.close();
                    }
                }, 500);
            }

        }).catch((e) => {
            this._showError(e);
        });
    }

    _getGetParameter(parameterName) {
        var result = null,
            tmp = [];
        location.search
            .substr(1)
            .split("&")
            .forEach(function (item) {
                tmp = item.split("=");
                if (tmp[0] === parameterName) {
                    result = decodeURIComponent(tmp[1]);
                }
            });
        return result;
    }

    _onCallBtnClick() {
        let value = this._nrField.value.trim(), nr=this._cleanupNumber(value);
        if (nr) {
            this._makeCall(nr);

        } else if (!nr && value) {
            this._showError(new Error('invalid number'));
        }
    }

    _onNrFieldBlur() {
        this._nrField.value = this._formatNumber(this._cleanupNumber(this._nrField.value));
    }

    _onNrFieldKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();

            let value = this._nrField.value.trim(), nr=this._cleanupNumber(value);
            if (nr) {
                this._makeCall(nr);
            }
        }
    }

    _cleanupNumber(telNr) {
        telNr = telNr.replace(/[^0-9\+]/g, '');
        telNr = telNr.replace(/^\+/, '00');
        telNr = telNr.replace(/[^0-9]/g, '');
        return telNr;
    }

    _formatNumber(telNr) {
        if (telNr.match(/^(\+41|0041|0)(8|9)[0-9]{8}$/)) {
            telNr = telNr.replace(/^(0041|0)(8|9)([0-9]{2})([0-9]{3})([0-9]{3})$/, '0$2$3 $4 $5');
        }
        if (telNr.match(/^(\+41|0041|0)[0-9]{9}$/)) {
            telNr = telNr.replace(/^(0041|0)([0-9]{2})([0-9]{3})([0-9]{2})([0-9]{2})$/, '0$2 $3 $4 $5');
        }

        return telNr;
    }

    _showMessage(title, msg) {
        let msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        msgDiv.style.display = '';

        let msgDivTitle = document.createElement('h3');
        msgDivTitle.textContent = title;
        msgDiv.appendChild(msgDivTitle);

        let msgDivText = document.createElement('p');
        msgDivText.textContent = msg;
        msgDiv.appendChild(msgDivText);

        if (this._msgDiv.hasChildNodes()) {
            this._msgDiv.insertBefore(msgDiv, this._msgDiv.firstChild);
        } else {
            this._msgDiv.appendChild(msgDiv);
        }
    }

    _showError(err) {
        let errDiv = document.createElement('div');
        errDiv.className = 'error';
        errDiv.style.display = '';

        let errDivTitle = document.createElement('h3');
        errDivTitle.textContent = 'error';
        errDiv.appendChild(errDivTitle);

        let errDivText = document.createElement('p');
        if (err.message) {
            errDivText.textContent = err.message;
        } else if (typeof err.toString === 'string') {
            errDivText.textContent = err.toString();
        } else {
            errDivText.textContent = 'unknown error';
        }
        errDiv.appendChild(errDivText);

        if (this._msgDiv.hasChildNodes()) {
            this._msgDiv.insertBefore(errDiv, this._msgDiv.firstChild);
        } else {
            this._msgDiv.appendChild(errDiv);
        }
    }

}
