/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/**
 * Represent a picture taken using Photobox.
 */
class PhotoboxPicture {

    private _hashid : string;

    private _urlOriginalPicture : string;
    private _urlMediumPicture : string;
    private _urlSmallPicture : string;

    constructor(hashid : string) {
        this._hashid = hashid;
    }

    getURLOriginalPicture() : string {
        return this._urlOriginalPicture;
    }

    getURLMediumPicture() : string {
        return this._urlMediumPicture;
    }

    getURLSmallPicture() : string {
        return this._urlSmallPicture;
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