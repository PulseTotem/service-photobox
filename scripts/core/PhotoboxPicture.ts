/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../t6s-core/core-backend/scripts/RestClient.ts" />

var moment = require('moment');

/**
 * Represent a picture taken using Photobox.
 */
class PhotoboxPicture {

    private _hashid : string;

    private _collectionId : string;
    private _urlOriginalPicture : string;
    private _urlMediumPicture : string;
    private _base64 : string;

    constructor(hashid : string, base64 : string, collectionid : string) {
        this._hashid = hashid;
        this._collectionId = collectionid;
        this._base64 = base64;

        this._urlOriginalPicture = PhotoboxUtils.getOriginalUrlFromId(this._hashid);
        this._urlMediumPicture = PhotoboxUtils.getMediumUrlFromId(this._hashid);
    }

    getBase64() : string {
        return this._base64;
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
        var urlDelete = ServiceConfig.getCMSHost() + "admin/images_collections/"+this._collectionId+"/images/"+this._hashid;
        RestClient.delete(urlDelete, successCallback, failCallback, ServiceConfig.getCMSAuthKey());
    }
}