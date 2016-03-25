/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

var moment = require('moment');

/**
 * Represent a picture taken using Photobox.
 */
class PhotoboxPicture {

    private _hashid : string;

    private _urlOriginalPicture : string;
    private _urlMediumPicture : string;

    constructor(hashid : string) {
        this._hashid = hashid;

        this._urlOriginalPicture = ServiceConfig.getCMSHost() + "images/" + this._hashid + "/raw?size=original";
        this._urlMediumPicture = ServiceConfig.getCMSHost() + "images/" + this._hashid + "/raw?size=medium";
    }

    getURLOriginalPicture() : string {
        return this._urlOriginalPicture;
    }

    getURLMediumPicture() : string {
        return this._urlMediumPicture;
    }

    delete() {
        try {
            fs.unlinkSync(this._localOriginalPicture);
            Logger.debug("Delete the original picture at the path: "+this._localOriginalPicture);
        } catch (e) {
            Logger.error("Error when trying to delete the original picture at the path: "+this._localOriginalPicture+". "+e);
        }

        try {
            fs.unlinkSync(this._localMediumPicture);
            Logger.debug("Delete the medium picture at the path: "+this._localMediumPicture);
        } catch (e) {
            Logger.error("Error when trying to delete the medium picture at the path: "+this._localMediumPicture+". "+e);
        }

        try {
            fs.unlinkSync(this._localSmallPicture);
            Logger.debug("Delete the small picture at the path: "+this._localSmallPicture);
        } catch (e) {
            Logger.error("Error when trying to delete the small picture at the path: "+this._localSmallPicture+". "+e);
        }
    }
}