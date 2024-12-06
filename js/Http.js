/*
 * Copyright © 2024 Netas Ltd., Switzerland.
 * All rights reserved.
 * @author  Netas AG, support@netas.ch
 * @date    2024-12-06
 */


class Http {

    constructor(url, user, password) {
        this._url = url;
        this._user = user;
        this._password = password;
    }

    // PUBLIC
    async requestSystemStatus() {

        // URL für Status-Abfrage
        let url = this._url.match(/https?:\/\/[^\/]+/);

        let rep = await this._doRequest(url);
        return rep.status;
    }

    async makeCall(calledDirectoryNumber, doNotPrompt, callingDevice) {

        // Nummer einfüllen
        let url = this._url.replace('{number}', `${encodeURIComponent(calledDirectoryNumber)}`);

        // Anruf auslösen
        let rep = await this._doRequest(url);
        return rep.status;
    }

    // PRIVATE
    _doRequest(url) {
        return new Promise((resolve, reject) => {

            // URL ermitteln
            let reqUrl = this._url;
            if (url) {
                reqUrl = url;
            }

            if (!url) {
                reject(new Error('URL of servlet not set. Go to about:addons of your browser to set the url.'));
            }

            let req = new XMLHttpRequest();
            if (this._user) {
                req.open("GET", url, true, this._user, this._password);
                req.withCredentials = true;

            } else {
                req.open("GET", url, true);
            }

            req.addEventListener("load", () => {
                if (req.status >= 200 && req.status < 300) {
                    resolve(req);
                } else {
                    reject(new Error(`Request failed with status ${req.status}: ${req.statusText}`));
                }
            });
            req.addEventListener("error", (error) => {
                reject(error);
            });

            req.send();
        });
    }
}
