/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

var moment = require('moment');
var request = require('request');

/**
 * Represent a picture taken using Photobox.
 */
class PhotoboxPicture {

    private _hashid : string;

    private _urlOriginalPicture : string;
    private _urlMediumPicture : string;

    constructor(hashid : string) {
        this._hashid = hashid;

        this._urlOriginalPicture = PhotoboxUtils.getOriginalUrlFromId(this._hashid);
        this._urlMediumPicture = PhotoboxUtils.getMediumUrlFromId(this._hashid);
    }

    getURLOriginalPicture() : string {
        return this._urlOriginalPicture;
    }

    getURLMediumPicture() : string {
        return this._urlMediumPicture;
    }

    getId() : string {
        return this._hashid;
    }

    delete(successCallback : Function, failCallback : Function) {
        var urlDelete = ServiceConfig.getCMSHost() + "/images/"+this._hashid;

        var options = {
            url: urlDelete,
            header: {
                Authorization: ServiceConfig.getCMSAuthKey()
            }
        };

        request.delete(options, successCallback, failCallback);
    }
}